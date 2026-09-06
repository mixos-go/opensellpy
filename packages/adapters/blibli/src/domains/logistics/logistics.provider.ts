import { randomUUID } from 'node:crypto'
import {
  NotFoundError,
  ValidationError,
  type CreateShipmentInput,
  type ILogisticsProvider,
  type Shipment,
  type ShipmentStatus,
  type TrackingEvent,
} from '@mixos-go/opensellpy-core'
import type {
  BlibliClient,
  BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliRequestMeta } from '../../config.js'
import { callEnvelope, callRaw } from '../../client/request.js'
import { mapBlibliError } from '../../errors/blibli-error.mapper.js'
import type { RawBlibliOrderDetail, RawBlibliPackage } from '../order/order.mapper.js'
import {
  COMBINE_SHIPPING_V1,
  CREATE_PACKAGE_V1,
  FULFILL_REGULAR_V2,
  ORDER_DETAIL_V2,
  ORDER_LIST_V2,
} from '../order/order.spec.js'

interface RawShipmentStatus {
  status?: string
  timestamp?: number
}

interface RawCombineValue {
  combineShipping?: Array<{ orderItemNo?: string }>
}

interface RawPackageValue {
  packageId?: number
}

interface RawOrderItemsEnvelope {
  content?: RawBlibliPackage[]
}

const EPOCH_ISO = new Date(0).toISOString()

function toIso(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return EPOCH_ISO
  return new Date(ms).toISOString()
}

function mapEventStatus(description: string | undefined): ShipmentStatus {
  const d = description ?? ''
  if (/delivered/.test(d)) return 'delivered'
  if (/failed/.test(d)) return 'failed'
  if (/cancel/.test(d)) return 'cancelled'
  if (/return/.test(d)) return 'failed'
  if (/pick/.test(d)) return 'picked'
  if (/courier|transit|in.transit|dispatch|ship/.test(d)) return 'in-transit'
  return 'created'
}

function mapShipmentStatus(itemStatus: string | undefined): ShipmentStatus {
  switch (itemStatus) {
    case 'FR':
      return 'in-transit'
    case 'D':
      return 'delivered'
    case 'CX':
      return 'cancelled'
    case 'RT':
    case 'VB':
      return 'failed'
    default:
      return 'created'
  }
}

/**
 * Logistics provider Blibli. `createShipment` = paket (package) + fulfill
 * (Fulfill Regular V2); tracking dibaca dari Order List V2 (filter packageId)
 * + Order Detail V2 (`shipment.statuses`). Pembatalan paket via API tidak
 * didukung (ValidationError).
 */
export class BlibliLogisticsProvider implements ILogisticsProvider {
  private readonly connector: BlibliConnector
  private readonly shopId: string
  private readonly meta: BlibliRequestMeta

  constructor(connector: BlibliConnector, shopId: string, meta: BlibliRequestMeta) {
    this.connector = connector
    this.shopId = shopId
    this.meta = meta
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    try {
      const client = await this.client()
      const detail = await this.orderDetail(client, input.orderId)
      const packageId = await this.ensurePackage(client, input.orderId, detail.packageId)
      await callRaw<unknown>(client, FULFILL_REGULAR_V2, this.params({ 'package-id': packageId }))
      return {
        id: String(packageId),
        platformShipmentId: String(packageId),
        orderId: input.orderId,
        status: 'created',
        items: input.items ?? [],
        events: [],
        raw: { packageId, orderId: input.orderId },
      }
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async getTracking(shipmentId: string): Promise<Shipment> {
    try {
      const client = await this.client()
      const env = await callEnvelope(client, ORDER_LIST_V2, this.params({ ...this.orderListBody(shipmentId) }))
      const raw = env as RawOrderItemsEnvelope
      const packages = raw.content ?? []
      const item = packages
        .flatMap((p) => p.orderItems ?? [])
        .find((it) => it.order?.itemId !== undefined)
      if (item === undefined) {
        throw new NotFoundError(`Paket ${shipmentId} tidak ditemukan di Blibli`, {
          platform: 'blibli',
        })
      }
      const itemId = item.order?.itemId
      if (itemId === undefined) throw new NotFoundError(`Paket ${shipmentId} tanpa order item`, { platform: 'blibli' })
      const content = await this.orderDetail(client, itemId)
      return this.buildShipment(shipmentId, itemId, content)
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async cancelShipment(_shipmentId: string): Promise<void> {
    throw new ValidationError(
      'Blibli tidak mendukung pembatalan paket via API — batalkan di Seller Center.',
      { platform: 'blibli' },
    )
  }

  private buildShipment(shipmentId: string, orderId: string, content: RawBlibliOrderDetail): Shipment {
    const shipment = content.shipment as
      | {
          airwayBill?: { number?: string }
          logistic?: { product?: { code?: string; name?: string } }
          statuses?: RawShipmentStatus[]
        }
      | undefined
    const events: TrackingEvent[] = (shipment?.statuses ?? []).map((s) => ({
      status: mapEventStatus(s.status),
      ...(s.status !== undefined && s.status !== '' ? { description: s.status } : {}),
      timestamp: toIso(s.timestamp),
    }))
    return {
      id: shipmentId,
      platformShipmentId: shipmentId,
      orderId,
      ...(shipment?.airwayBill?.number !== undefined && shipment.airwayBill.number !== ''
        ? { trackingNumber: shipment.airwayBill.number }
        : {}),
      ...(shipment?.logistic?.product?.name !== undefined && shipment.logistic.product.name !== ''
        ? { carrier: shipment.logistic.product.name }
        : {}),
      status: mapShipmentStatus(content.status),
      items: [{ sku: content.product?.sellerSku ?? '', quantity: content.quantity ?? 0 }],
      events,
      raw: content,
    }
  }

  /** Order detail utk order-item id + NotFound bila kosong. */
  private async orderDetail(client: BlibliClient, itemId: string): Promise<RawBlibliOrderDetail> {
    const content = await callRaw<RawBlibliOrderDetail>(
      client,
      ORDER_DETAIL_V2,
      this.params({ 'order-item-id': itemId }),
    )
    if (content === null || (content.itemId === undefined && content.id === undefined)) {
      throw new NotFoundError(`Order ${itemId} tidak ditemukan di Blibli`, { platform: 'blibli' })
    }
    return content
  }

  /**
   * Pastikan order item punya paket: pakai `packageId` bila sudah ada; kalau
   * belum, gabung via Combine Shipping + Create Package V1.
   */
  private async ensurePackage(
    client: BlibliClient,
    itemId: string,
    existingPackageId: number | undefined,
  ): Promise<number> {
    if (existingPackageId !== undefined && existingPackageId > 0) return existingPackageId
    const combine = await callRaw<RawCombineValue>(
      client,
      COMBINE_SHIPPING_V1,
      this.params({ businessPartnerCode: this.meta.storeCode, orderItemNo: itemId }),
    )
    const eligible = (combine.combineShipping ?? [])
      .map((c) => c.orderItemNo)
      .filter((no): no is string => no !== undefined && no !== '')
    const value = await callRaw<RawPackageValue>(
      client,
      CREATE_PACKAGE_V1,
      this.params({ orderItemIds: eligible.length > 0 ? eligible : [itemId] }),
    )
    if (value.packageId === undefined) {
      throw new ValidationError('createPackage Blibli berhasil tanpa packageId.', {
        platform: 'blibli',
      })
    }
    return value.packageId
  }

  private orderListBody(packageId: string): Record<string, unknown> {
    return {
      filter: { packageId: Number(packageId) },
      paging: { page: 0, size: 10 },
      sorting: { by: 'statusFPUpdatedTimestamp', direction: 'ASC' },
    }
  }

  private params(extra: Record<string, unknown>): Record<string, unknown> {
    return {
      requestId: randomUUID(),
      storeCode: this.meta.storeCode,
      username: this.meta.username,
      storeId: this.meta.storeId,
      channelId: this.meta.channelId,
      ...extra,
    }
  }

  private async client(): Promise<BlibliClient> {
    return this.connector.getClient(this.shopId)
  }
}
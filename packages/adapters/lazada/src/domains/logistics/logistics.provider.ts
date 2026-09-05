import {
  NotFoundError,
  ValidationError,
  type CreateShipmentInput,
  type ILogisticsProvider,
  type Shipment,
  type ShipmentStatus,
  type TrackingEvent,
} from '@opensellpy/core'
import {
  LazadaFulfillmentAPIApi,
  LazadaOrderAPIApi,
  type LazadaClient,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import { callRaw } from '../../client/request.js'
import { mapLazadaError } from '../../errors/lazada-error.mapper.js'
import { fromLazadaOrderStatusToItem } from '../order/order.status-map.js'
import type { RawLazadaOrderItem } from '../order/order.mapper.js'

interface PackItemResult {
  order_item_id?: number
  package_id?: string
  tracking_number?: string
  shipment_provider?: string
  msg?: string
}

interface PackOrderResult {
  order_id?: number
  order_item_list?: PackItemResult[]
}

interface PackResult {
  result?: Array<{ data?: Array<{ pack_order_list?: PackOrderResult[] }> }>
}

const EPOCH_ISO = new Date(0).toISOString()

function mapStatus(raw: string | undefined): ShipmentStatus {
  const item = fromLazadaOrderStatusToItem(raw)
  switch (item) {
    case 'shipped':
      return 'in-transit'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    case 'returned':
      return 'failed'
    default:
      return 'created'
  }
}

/**
 * Logistics provider Lazada: pack (`/order/fulfill/pack`) → tracking snapshot
 * dari order/items/get (Lazada tidak menyediakan riwayat event lintas carrier).
 */
export class LazadaLogisticsProvider implements ILogisticsProvider {
  private readonly connector: LazadaConnector
  private readonly shopId: string
  private readonly shipmentOrders = new Map<string, string>()
  private readonly shipmentItems = new Map<string, Shipment['items']>()

  constructor(connector: LazadaConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    try {
      const client = await this.client()
      const orderApi = new LazadaOrderAPIApi(client)
      const fulfillment = new LazadaFulfillmentAPIApi(client)

      const itemsRaw = await callRaw<RawLazadaOrderItem[]>(
        orderApi.getOrderItems({ order_id: Number(input.orderId) }),
      )
      if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
        throw new NotFoundError(`Order ${input.orderId} tidak punya item untuk di-pack di Lazada`, {
          platform: 'lazada',
        })
      }
      const itemIds = itemsRaw
        .map((it) => it.order_item_id)
        .filter((id): id is number => id !== undefined)

      const raw = await callRaw<PackResult>(
        fulfillment.pack({
          packReq: {
            pack_order_list: [{ order_id: Number(input.orderId), order_item_list: itemIds }],
            delivery_type: 'dropship',
            shipping_allocate_type: 'default',
          },
          'packReq.pack_order_list': [
            { order_id: Number(input.orderId), order_item_list: itemIds },
          ],
          'packReq.pack_order_list.order_item_list': itemIds,
          'packReq.pack_order_list.order_id': Number(input.orderId),
          'packReq.delivery_type': 'dropship',
          'packReq.shipping_allocate_type': 'default',
        } as never),
      )
      const packed = raw.result?.[0]?.data?.[0]?.pack_order_list?.[0]
      const first = packed?.order_item_list?.[0]
      const packageId = first?.package_id ?? `pack-${input.orderId}`
      this.shipmentOrders.set(packageId, input.orderId)
      this.shipmentItems.set(packageId, input.items ?? [])
      return {
        id: packageId,
        platformShipmentId: packageId,
        orderId: input.orderId,
        ...(first?.tracking_number !== undefined && first.tracking_number !== ''
          ? { trackingNumber: first.tracking_number }
          : {}),
        ...(first?.shipment_provider !== undefined && first.shipment_provider !== ''
          ? { carrier: first.shipment_provider }
          : {}),
        status: 'created',
        items: input.items ?? [],
        events: [],
        raw: { packageId, orderId: input.orderId },
      }
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async getTracking(shipmentId: string): Promise<Shipment> {
    try {
      const client = await this.client()
      const orderId = this.shipmentOrders.get(shipmentId)
      if (orderId === undefined) {
        throw new NotFoundError(
          `Paket ${shipmentId} tidak dikenal; buat via createShipment dulu.`,
          { platform: 'lazada' },
        )
      }
      const orderApi = new LazadaOrderAPIApi(client)
      const itemsRaw = await callRaw<RawLazadaOrderItem[]>(
        orderApi.getOrderItems({ order_id: Number(orderId) }),
      )
      const first = Array.isArray(itemsRaw) ? itemsRaw[0] : undefined
      if (first === undefined) {
        throw new NotFoundError(`Order ${orderId} tidak punya item utk tracking di Lazada`, {
          platform: 'lazada',
        })
      }
      const status = mapStatus(first.status)
      const event: TrackingEvent = {
        status,
        timestamp: first.updated_at === undefined ? EPOCH_ISO : toIso(first.updated_at),
        ...(first.shipment_provider !== undefined ? { description: first.shipment_provider } : {}),
      }
      const items = this.shipmentItems.get(shipmentId) ?? []
      return {
        id: shipmentId,
        platformShipmentId: shipmentId,
        orderId,
        ...(first.tracking_code !== undefined && first.tracking_code !== ''
          ? { trackingNumber: first.tracking_code }
          : (first.tracking_code_pre !== undefined && first.tracking_code_pre !== ''
              ? { trackingNumber: first.tracking_code_pre }
              : {})),
        ...(first.shipment_provider !== undefined && first.shipment_provider !== ''
          ? { carrier: first.shipment_provider }
          : {}),
        status,
        items,
        events: [event],
        raw: { orderId, item: first },
      }
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async cancelShipment(_shipmentId: string): Promise<void> {
    throw new ValidationError(
      'Lazada tidak mendukung pembatalan paket via API — batalkan di Seller Center.',
      { platform: 'lazada' },
    )
  }

  private async client(): Promise<LazadaClient> {
    return this.connector.getClient(this.shopId)
  }
}

function toIso(raw: string): string {
  const t = Date.parse(raw)
  return Number.isNaN(t) ? EPOCH_ISO : new Date(t).toISOString()
}
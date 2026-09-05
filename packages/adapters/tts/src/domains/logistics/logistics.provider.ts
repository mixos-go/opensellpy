import {
  NotFoundError,
  ValidationError,
  type CreateShipmentInput,
  type ILogisticsProvider,
  type Shipment,
} from '@opensellpy/core'
import type { ApiCallSpec, TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { callRaw } from '../../client/request.js'
import { mapTiktokError } from '../../errors/tiktok-error.mapper.js'
import { fromTiktokTracking, type RawTiktokTracking } from './logistics.mapper.js'

const SHIP_PACKAGE_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/fulfillment/202309/orders/{order_id}/packages',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['order_id'],
  body: ['order_line_item_ids', 'shipping_provider_id', 'tracking_number'],
}

const TRACKING_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/fulfillment/202309/orders/{order_id}/tracking',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['order_id'],
  body: [],
}

interface RawCreatePackageResponse {
  package_id?: string
}

/**
 * Logistics provider TikTok Shop: create package (ship order) → tracking.
 * ID paket TikTok dari response create; `getTracking` butuh paket yang dibuat
 * lewat createShipment (paket di-memori ke order_id-nya).
 */
export class TiktokLogisticsProvider implements ILogisticsProvider {
  private readonly connector: TikTokShopConnector
  private readonly shopId: string
  private readonly shipmentOrders = new Map<string, string>()
  private readonly shipmentItems = new Map<string, Shipment['items']>()

  constructor(connector: TikTokShopConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawCreatePackageResponse>(client, SHIP_PACKAGE_SPEC, {
        order_id: input.orderId,
      })
      const packageId = res.package_id
      if (packageId === undefined || packageId === '') {
        throw new ValidationError(
          `Create package utk order ${input.orderId} TikTok berhasil tanpa package_id.`,
          { platform: 'tts' },
        )
      }
      this.shipmentOrders.set(packageId, input.orderId)
      this.shipmentItems.set(packageId, input.items ?? [])
      return {
        id: packageId,
        platformShipmentId: packageId,
        orderId: input.orderId,
        status: 'created',
        items: input.items ?? [],
        events: [],
        raw: { packageId },
      }
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async getTracking(shipmentId: string): Promise<Shipment> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const orderId = this.shipmentOrders.get(shipmentId)
      if (orderId === undefined) {
        throw new NotFoundError(
          `Paket ${shipmentId} tidak dikenal; buat via createShipment dulu.`,
          { platform: 'tts' },
        )
      }
      const tracking = await callRaw<RawTiktokTracking>(client, TRACKING_SPEC, {
        order_id: orderId,
      })
      return fromTiktokTracking(tracking, {
        shipmentId,
        orderId,
        items: this.shipmentItems.get(shipmentId) ?? [],
      })
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async cancelShipment(_shipmentId: string): Promise<void> {
    throw new ValidationError(
      'TikTok Shop tidak mendukung pembatalan paket via API — batalkan di Seller Center.',
      { platform: 'tts' },
    )
  }
}
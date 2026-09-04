import {
  NotFoundError,
  ValidationError,
  type CreateShipmentInput,
  type ILogisticsProvider,
  type Shipment,
} from '@opensellpy/core'
import type { ApiCallSpec, ShopeeConnector } from '@mixos-go/shopee-sdk'
import { callRaw } from '../../client/request.js'
import { mapShopeeError } from '../../errors/shopee-error.mapper.js'
import { fromShopeeTrackingInfo, type RawTrackingInfo } from './logistics.mapper.js'

const SHIP_ORDER_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/logistics/ship_order',
  query: [],
  body: ['order_sn'],
  scope: 'shop',
}

const ORDER_DETAIL_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/order/get_order_detail',
  query: ['order_sn_list'],
  body: [],
  scope: 'shop',
}

const TRACKING_NUMBER_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/logistics/get_tracking_number',
  query: ['order_sn', 'package_number'],
  body: [],
  scope: 'shop',
}

const TRACKING_INFO_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/logistics/get_tracking_info',
  query: ['order_sn', 'package_number'],
  body: [],
  scope: 'shop',
}

interface RawOrderDetail {
  package_list?: Array<{ package_number?: string }>
}

interface RawOrderDetailResponse {
  order_list?: RawOrderDetail[]
}

interface RawTrackingNumber {
  tracking_number?: string
}

/**
 * Logistics provider Shopee: ship_order → package_number (dari get_order_detail)
 * → tracking. `getTracking` butuh package yang dibuat lewat createShipment
 * (paket di-memori ke order_sn-nya).
 */
export class ShopeeLogisticsProvider implements ILogisticsProvider {
  private readonly connector: ShopeeConnector
  private readonly shopId: string
  private readonly shipmentOrders = new Map<string, string>()

  constructor(connector: ShopeeConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    try {
      const client = await this.connector.getClient(this.shopId)
      await callRaw<Record<string, never>>(client, SHIP_ORDER_SPEC, {
        order_sn: input.orderId,
      })
      const detail = await callRaw<RawOrderDetailResponse>(client, ORDER_DETAIL_SPEC, {
        order_sn_list: [input.orderId],
      })
      const packageNumber = detail.order_list?.at(0)?.package_list?.at(0)?.package_number
      if (packageNumber === undefined || packageNumber === '') {
        throw new ValidationError(
          `ship_order sukses untuk order ${input.orderId} tapi package_number tidak tersedia.`,
          { platform: 'shopee' },
        )
      }
      this.shipmentOrders.set(packageNumber, input.orderId)
      return {
        id: packageNumber,
        platformShipmentId: packageNumber,
        orderId: input.orderId,
        status: 'created',
        items: input.items ?? [],
        events: [],
        raw: { packageNumber },
      }
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async getTracking(shipmentId: string): Promise<Shipment> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const orderId = this.shipmentOrders.get(shipmentId)
      if (orderId === undefined) {
        throw new NotFoundError(
          `Paket ${shipmentId} tidak dikenal; buat via createShipment dulu.`,
          { platform: 'shopee' },
        )
      }
      const [trackingNumber, tracking] = await Promise.all([
        callRaw<RawTrackingNumber>(client, TRACKING_NUMBER_SPEC, {
          order_sn: orderId,
          package_number: shipmentId,
        }),
        callRaw<RawTrackingInfo>(client, TRACKING_INFO_SPEC, {
          order_sn: orderId,
          package_number: shipmentId,
        }),
      ])
      return fromShopeeTrackingInfo(tracking, {
        orderId,
        ...(trackingNumber.tracking_number !== undefined
          ? { trackingNumber: trackingNumber.tracking_number }
          : {}),
      })
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async cancelShipment(_shipmentId: string): Promise<void> {
    throw new ValidationError(
      'Shopee tidak mendukung pembatalan paket via API — batalkan di Seller Center.',
      { platform: 'shopee' },
    )
  }
}
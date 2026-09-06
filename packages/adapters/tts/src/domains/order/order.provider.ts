import {
  NotFoundError,
  ValidationError,
  type IOrderProvider,
  type ListOrdersParams,
  type Order,
  type OrderStatus,
  type PaginatedResult,
} from '@mixos-go/opensellpy-core'
import type { ApiCallSpec, TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { callRaw } from '../../client/request.js'
import { mapTiktokError } from '../../errors/tiktok-error.mapper.js'
import { fromTiktokOrder, type RawTiktokOrder } from './order.mapper.js'
import { toTiktokSearchOrdersParams } from './order.params-mapper.js'

const ORDER_SEARCH_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/order/202309/orders/search',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['page_size', 'sort_order', 'page_token', 'sort_field', 'shop_cipher'],
  headers: [],
  pathParams: [],
  body: ['buyer_user_id', 'create_time_ge', 'create_time_lt', 'is_buyer_request_cancel', 'order_status', 'shipping_type', 'update_time_ge', 'update_time_lt', 'warehouse_ids'],
}

const ORDER_DETAIL_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/order/202507/orders',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['ids', 'shop_cipher'],
  headers: [],
  pathParams: [],
  body: [],
}

const SHIP_PACKAGE_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/fulfillment/202309/orders/{order_id}/packages',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['order_id'],
  body: ['order_line_item_ids', 'shipping_provider_id', 'tracking_number'],
}

interface RawOrderSearchResponse {
  orders?: RawTiktokOrder[]
  next_page_token?: string
}

interface RawOrderDetailResponse {
  orders?: RawTiktokOrder[]
}

interface RawShipPackageResponse {
  package_id?: string
}

/**
 * Order provider TikTok Shop: order search (list) + order detail (202507) +
 * create package (ship) utk transisi `ready-to-ship` → `shipped`.
 * Pembatalan order via API tidak didukung di TikTok (ValidationError).
 */
export class TiktokOrderProvider implements IOrderProvider {
  private readonly connector: TikTokShopConnector
  private readonly shopId: string

  constructor(connector: TikTokShopConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawOrderSearchResponse>(
        client,
        ORDER_SEARCH_SPEC,
        toTiktokSearchOrdersParams(params),
      )
      const items = (res.orders ?? []).map(fromTiktokOrder)
      return {
        items,
        total: items.length,
        page: params.page,
        limit: params.limit,
        hasNext: res.next_page_token !== undefined && res.next_page_token !== '',
      }
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawOrderDetailResponse>(client, ORDER_DETAIL_SPEC, {
        ids: orderId,
      })
      const raw = res.orders?.at(0)
      if (raw === undefined) {
        throw new NotFoundError(`Order ${orderId} tidak ditemukan di TikTok Shop`, { platform: 'tts' })
      }
      return fromTiktokOrder(raw)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, _reason?: string): Promise<Order> {
    try {
      if (status !== 'shipped') {
        throw new ValidationError(
          `Status "${status}" tidak didukung TikTok (hanya shipped via create package).`,
          { platform: 'tts' },
        )
      }
      const client = await this.connector.getClient(this.shopId)
      await callRaw<RawShipPackageResponse>(client, SHIP_PACKAGE_SPEC, { order_id: orderId })
      return this.getOrder(orderId)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }
}
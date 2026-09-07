import {
  NotFoundError,
  ValidationError,
  type IOrderProvider,
  type ListOrdersParams,
  type Order,
  type OrderStatus,
  type PaginatedResult,
} from '@mixos-go/opensellpy-core'
import type { ApiCallSpec, ShopeeConnector } from '@mixos-go/shopee-sdk'
import { callRaw } from '../../client/request.js'
import { mapShopeeError } from '../../errors/shopee-error.mapper.js'
import { fromShopeeOrder, type RawOrder } from './order.mapper.js'
import { toShopeeListOrdersParams } from './order.params-mapper.js'

const ORDER_LIST_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/order/get_order_list',
  query: ['time_range_field', 'time_from', 'time_to', 'page_size', 'cursor', 'order_status', 'response_optional_fields'],
  body: [],
  scope: 'shop',
}

const ORDER_DETAIL_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/order/get_order_detail',
  query: ['order_sn_list', 'response_optional_fields'],
  body: [],
  scope: 'shop',
}

const CANCEL_ORDER_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/order/cancel_order',
  query: [],
  body: ['order_sn', 'cancel_reason'],
  scope: 'shop',
}

// Detail optional (item_list, total_amount, alamat, time) hanya dikembalikan
// Shopee kalau diminta lewat `response_optional_fields`.
// get_order_list TIDAK mendukung `item_list`/`total_amount` (sandbox menolak;
// hanya order_sn+order_status yang bawaan) — item & total ambil via detail.
const ORDER_LIST_OPTIONAL_FIELDS: string[] = []
const ORDER_DETAIL_OPTIONAL_FIELDS = ['item_list', 'total_amount', 'currency', 'recipient_address', 'order_status']

const SHIP_ORDER_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/logistics/ship_order',
  query: [],
  body: ['order_sn'],
  scope: 'shop',
}

interface RawOrderListResponse {
  order_list?: RawOrder[]
  more?: boolean
}

interface RawOrderDetailResponse {
  order_list?: RawOrder[]
}

/**
 * Order provider Shopee: get_order_list / get_order_detail / cancel_order +
 * ship_order (utk transisi status `ready-to-ship` → `shipped`).
 * Depend ke connector SDK via `getClient(shopId)` (auto-refresh token).
 */
export class ShopeeOrderProvider implements IOrderProvider {
  private readonly connector: ShopeeConnector
  private readonly shopId: string

  constructor(connector: ShopeeConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const shopeeParams = toShopeeListOrdersParams(params)
      const res = await callRaw<RawOrderListResponse>(client, ORDER_LIST_SPEC, {
        ...shopeeParams,
        ...(ORDER_LIST_OPTIONAL_FIELDS.length > 0
          ? { response_optional_fields: ORDER_LIST_OPTIONAL_FIELDS }
          : {}),
      })
      const items = (res.order_list ?? []).map(fromShopeeOrder)
      return {
        items,
        total: items.length,
        page: params.page,
        limit: params.limit,
        hasNext: res.more === true,
      }
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawOrderDetailResponse>(client, ORDER_DETAIL_SPEC, {
        order_sn_list: [orderId],
        response_optional_fields: ORDER_DETAIL_OPTIONAL_FIELDS,
      })
      const raw = res.order_list?.[0]
      if (raw === undefined) {
        throw new NotFoundError(`Order ${orderId} tidak ditemukan di Shopee`, { platform: 'shopee' })
      }
      return fromShopeeOrder(raw)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<Order> {
    try {
      if (status === 'cancelled') {
        await this.cancelOrder(orderId, reason)
      } else if (status === 'shipped') {
        await this.shipOrder(orderId)
      } else {
        throw new ValidationError(
          `Status "${status}" tidak didukung Shopee (hanya cancelled / shipped).`,
          { platform: 'shopee' },
        )
      }
      return this.getOrder(orderId)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  private async cancelOrder(orderId: string, reason: string | undefined): Promise<void> {
    const client = await this.connector.getClient(this.shopId)
    await callRaw<Record<string, never>>(client, CANCEL_ORDER_SPEC, {
      order_sn: orderId,
      cancel_reason: reason ?? 'OTHERS',
    })
  }

  private async shipOrder(orderId: string): Promise<void> {
    const client = await this.connector.getClient(this.shopId)
    await callRaw<Record<string, never>>(client, SHIP_ORDER_SPEC, {
      order_sn: orderId,
    })
  }
}
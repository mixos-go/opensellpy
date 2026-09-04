import type { ListOrdersParams } from '@opensellpy/core'
import { toShopeeOrderStatus } from './order.status-map.js'

/** Default jendela waktu: 15 hari ke belakang (maksimum yang didukung Shopee). */
const MAX_LOOKBACK_SECONDS = 15 * 24 * 60 * 60

/**
 * Map ListOrdersParams → query params get_order_list.
 *
 * Pagination Shopee berbasis cursor; kontrak core pakai page/limit. Untuk
 * page 1 cursor tidak dikirim; page > 1 membutuhkan cursor lanjutan dari
 * response (tidak tersedia di kontrak ListOrdersParams) → dikembalikan
 * sebagaimana adanya (`cursor` di-omit) supaya tidak menembak URL invalid.
 */
export function toShopeeListOrdersParams(params: ListOrdersParams): Record<string, unknown> {
  const shopeeParams: Record<string, unknown> = {
    time_range_field: 'create_time',
    time_from: Math.floor(Date.now() / 1000) - MAX_LOOKBACK_SECONDS,
    time_to: Math.floor(Date.now() / 1000),
    page_size: params.limit,
  }
  if (params.status !== undefined) {
    const orderStatus = toShopeeOrderStatus(params.status)
    if (orderStatus !== undefined) shopeeParams['order_status'] = orderStatus
  }
  return shopeeParams
}
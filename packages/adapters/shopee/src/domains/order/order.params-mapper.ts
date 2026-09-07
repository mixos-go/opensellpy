import type { ListOrdersParams } from '@mixos-go/opensellpy-core'
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
  const now = Math.floor(Date.now() / 1000)
  const shopeeParams: Record<string, unknown> = {
    time_range_field: 'create_time',
    time_to: params.updatedTo ?? now,
    page_size: params.limit,
  }
  // Shopee mewajibkan window; default = 15 hari (maksimum yang didukung API).
  shopeeParams['time_from'] = params.updatedFrom ?? now - MAX_LOOKBACK_SECONDS
  if (params.status !== undefined) {
    const orderStatus = toShopeeOrderStatus(params.status)
    if (orderStatus !== undefined) shopeeParams['order_status'] = orderStatus
  }
  return shopeeParams
}
import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toShopeeItemStatus } from './product.status-map.js'

const DEFAULT_LOOKBACK_SECONDS = 15 * 24 * 60 * 60

/**
 * Map ListProductsParams → query params get_item_list.
 *
 * `item_status` di Shopee hanya bisa difilter satu nilai per request (SDK
 * men-serialize array jadi string CSV yang tidak diterima API). Saat status
 * tidak dispesifikasi, default `NORMAL` (barang aktif) dipakai — catatan
 * pembatasan produk aktif hanya.
 */
export function toShopeeListProductsParams(params: ListProductsParams): Record<string, unknown> {
  return {
    offset: (params.page - 1) * params.limit,
    page_size: params.limit,
    update_time_from: Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_SECONDS,
    update_time_to: Math.floor(Date.now() / 1000),
    item_status: params.status === undefined ? 'NORMAL' : toShopeeItemStatus(params.status),
  }
}
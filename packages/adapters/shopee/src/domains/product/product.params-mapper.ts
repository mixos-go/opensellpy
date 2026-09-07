import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toShopeeItemStatus } from './product.status-map.js'

/**
 * Map ListProductsParams → query params get_item_list.
 *
 * `item_status` di Shopee hanya bisa difilter satu nilai per request (SDK
 * men-serialize array jadi string CSV yang tidak diterima API). Saat status
 * tidak dispesifikasi, default `NORMAL` (barang aktif) dipakai — catatan
 * pembatasan produk aktif hanya.
 *
 * Window `update_time` TIDAK dikirim kecuali caller berikan `updatedFrom`/
 * `updatedTo` — menghindari item lama tersembunyi (temuan uji live).
 */
export function toShopeeListProductsParams(params: ListProductsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    offset: (params.page - 1) * params.limit,
    page_size: params.limit,
  }
  if (params.updatedFrom !== undefined) out['update_time_from'] = params.updatedFrom
  if (params.updatedTo !== undefined) out['update_time_to'] = params.updatedTo
  out['item_status'] = params.status === undefined ? 'NORMAL' : toShopeeItemStatus(params.status)
  return out
}
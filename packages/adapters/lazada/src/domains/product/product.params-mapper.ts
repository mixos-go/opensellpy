import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toLazadaProductFilter } from './product.status-map.js'

/**
 * Map ListProductsParams → params `getProducts` Lazada. Offset-based pagination
 * (max 10000); `create_after` hanya dikirim bila `updatedFrom` diberikan
 * (Lazada product TIDAK mendukung `create_before` → `updatedTo` diabaikan);
 * `filter` default `live`, di-set dari status bila diberikan.
 */
export function toLazadaListProductsParams(params: ListProductsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    offset: String((params.page - 1) * params.limit),
    limit: String(params.limit),
  }
  if (params.updatedFrom !== undefined) out['create_after'] = new Date(params.updatedFrom * 1000).toISOString()
  out['filter'] = params.status === undefined ? 'live' : toLazadaProductFilter(params.status)
  return out
}
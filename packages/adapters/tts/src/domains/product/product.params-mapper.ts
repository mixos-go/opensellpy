import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toTiktokProductStatus } from './product.status-map.js'

/**
 * Map ListProductsParams → body/products search TikTok. `page_size` + `status`
 * di-set bila diberikan; window `create_time` di-omit kecuali caller berikan
 * `updatedFrom`/`updatedTo` (hindari item lama tersembunyi). `page_token`
 * tidak dilanjutkan.
 */
export function toTiktokSearchProductsBody(params: ListProductsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (params.updatedFrom !== undefined) out['create_time_ge'] = params.updatedFrom
  if (params.updatedTo !== undefined) out['create_time_le'] = params.updatedTo
  if (params.status !== undefined) out['status'] = toTiktokProductStatus(params.status)
  return out
}
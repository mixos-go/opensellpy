import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toLazadaProductFilter } from './product.status-map.js'

const DEFAULT_LOOKBACK_MS = 15 * 24 * 60 * 60 * 1000

/**
 * Map ListProductsParams → params `getProducts` Lazada. Offset-based pagination
 * (max 10000); window waktu (15 hari) selalu dikirim; `filter` default `live`,
 * di-set dari status bila diberikan.
 */
export function toLazadaListProductsParams(params: ListProductsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    offset: String((params.page - 1) * params.limit),
    limit: String(params.limit),
    create_after: new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString(),
  }
  out['filter'] = params.status === undefined ? 'live' : toLazadaProductFilter(params.status)
  return out
}
import type { ListProductsParams } from '@mixos-go/opensellpy-core'
import { toBlibliProductStateFilter } from './product.status-map.js'

/**
 * Map ListProductsParams → body Product List V3 Blibli. Paging 0-based;
 * `size` dibatasi 50 oleh platform. Sorting by `createdDate` DESC.
 */
export function toBlibliListProductsBody(params: ListProductsParams): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  const state = toBlibliProductStateFilter(params.status)
  if (state !== undefined) filter['state'] = state
  return {
    filter,
    paging: { page: params.page - 1, size: Math.min(params.limit, 50) },
    sorting: { by: 'createdDate', direction: 'DESC' },
  }
}
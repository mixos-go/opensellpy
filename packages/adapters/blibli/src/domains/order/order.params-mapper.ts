import type { ListOrdersParams } from '@opensellpy/core'
import { toBlibliOrderStatuses } from './order.status-map.js'

/**
 * Map ListOrdersParams → body Order List V2 Blibli (`filter`/`paging`/`sorting`).
 * Paging 0-based di Blibli; `size` dibatasi 50 oleh platform.
 */
export function toBlibliOrderListBody(params: ListOrdersParams): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  const statuses = toBlibliOrderStatuses(params.status)
  if (statuses !== undefined) filter['orderItemStatuses'] = statuses
  return {
    filter,
    paging: { page: params.page - 1, size: Math.min(params.limit, 50) },
    sorting: { by: 'statusFPUpdatedTimestamp', direction: 'ASC' },
  }
}
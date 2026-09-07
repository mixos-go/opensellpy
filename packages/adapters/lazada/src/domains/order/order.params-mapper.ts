import type { ListOrdersParams } from '@mixos-go/opensellpy-core'
import { toLazadaOrderStatus } from './order.status-map.js'

const DEFAULT_LOOKBACK_MS = 15 * 24 * 60 * 60 * 1000

/**
 * Map ListOrdersParams → params `getOrders` Lazada. Pagination offset-based
 * ((page-1)*limit) sehingga `page > 1` lanjut. `created_after` default 15 hari
 * (wajib salah satu created_after/update_after), bisa di-override via
 * `updatedFrom`; `updatedTo` → `created_before` bila diberikan; `status`
 * di-omit saat tidak dispesifikasi / tidak didukung.
 */
export function toLazadaListOrdersParams(params: ListOrdersParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    offset: (params.page - 1) * params.limit,
    limit: params.limit,
    sort_by: 'created_at',
    sort_direction: 'DESC',
    created_after: new Date((params.updatedFrom ?? Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_MS / 1000) * 1000).toISOString(),
  }
  if (params.updatedTo !== undefined) out['created_before'] = new Date(params.updatedTo * 1000).toISOString()
  if (params.status !== undefined) {
    const status = toLazadaOrderStatus(params.status)
    if (status !== undefined) out['status'] = status
  }
  return out
}
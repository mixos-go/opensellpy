import type { ListOrdersParams } from '@opensellpy/core'
import { toLazadaOrderStatus } from './order.status-map.js'

const DEFAULT_LOOKBACK_MS = 15 * 24 * 60 * 60 * 1000

/**
 * Map ListOrdersParams → params `getOrders` Lazada. Pagination offset-based
 * ((page-1)*limit) sehingga `page > 1` lanjut. `created_after` (window 15 hari)
 * selalu dikirim (wajib salah satu created_after/update_after); `status`
 * di-omit saat tidak dispesifikasi / tidak didukung.
 */
export function toLazadaListOrdersParams(params: ListOrdersParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    offset: (params.page - 1) * params.limit,
    limit: params.limit,
    sort_by: 'created_at',
    sort_direction: 'DESC',
    created_after: new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString(),
  }
  if (params.status !== undefined) {
    const status = toLazadaOrderStatus(params.status)
    if (status !== undefined) out['status'] = status
  }
  return out
}
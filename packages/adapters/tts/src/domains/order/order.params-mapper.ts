import type { ListOrdersParams } from '@mixos-go/opensellpy-core'
import { toTiktokOrderStatus } from './order.status-map.js'

const DEFAULT_LOOKBACK_SECONDS = 15 * 24 * 60 * 60

/**
 * Map ListOrdersParams → params callRaw order search TikTok.
 * `page_size` + window waktu (15 hari) selalu dikirim; `order_status` di-omit
 * saat tidak dispesifikasi / tidak didukung. `page_token` (cursor TikTok) tidak
 * tersedia di kontrak core — `page > 1` tidak dilanjutkan.
 */
export function toTiktokSearchOrdersParams(params: ListOrdersParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    page_size: params.limit,
    create_time_ge: Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_SECONDS,
    create_time_lt: Math.floor(Date.now() / 1000),
  }
  if (params.status !== undefined) {
    const status = toTiktokOrderStatus(params.status)
    if (status !== undefined) out['order_status'] = status
  }
  return out
}
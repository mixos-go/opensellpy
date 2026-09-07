import type { ListOrdersParams } from '@mixos-go/opensellpy-core'
import { toTiktokOrderStatus } from './order.status-map.js'

const DEFAULT_LOOKBACK_SECONDS = 15 * 24 * 60 * 60

/**
 * Map ListOrdersParams → params callRaw order search TikTok.
 * `page_size` selalu dikirim; window `create_time` default 15 hari, bisa
 * di-override via `updatedFrom`/`updatedTo`; `order_status` di-omit saat tidak
 * dispesifikasi / tidak didukung. `page_token` (cursor TikTok) tidak tersedia
 * di kontrak core — `page > 1` tidak dilanjutkan.
 */
export function toTiktokSearchOrdersParams(params: ListOrdersParams): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000)
  const out: Record<string, unknown> = {
    page_size: params.limit,
    create_time_ge: params.updatedFrom ?? now - DEFAULT_LOOKBACK_SECONDS,
    create_time_lt: params.updatedTo ?? now,
  }
  if (params.status !== undefined) {
    const status = toTiktokOrderStatus(params.status)
    if (status !== undefined) out['order_status'] = status
  }
  return out
}
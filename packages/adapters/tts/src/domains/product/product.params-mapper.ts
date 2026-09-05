import type { ListProductsParams } from '@opensellpy/core'
import { toTiktokProductStatus } from './product.status-map.js'

const DEFAULT_LOOKBACK_SECONDS = 15 * 24 * 60 * 60

/**
 * Map ListProductsParams → body/products search TikTok. `page_size` + window
 * waktu selalu dikirim; `status` di-omit saat tidak dispesifikasi (default
 * `ACTIVE` dipakai bila perlu, lihat provider). `page_token` tidak dilanjutkan.
 */
export function toTiktokSearchProductsBody(params: ListProductsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    create_time_ge: Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_SECONDS,
    create_time_le: Math.floor(Date.now() / 1000),
  }
  if (params.status !== undefined) out['status'] = toTiktokProductStatus(params.status)
  return out
}
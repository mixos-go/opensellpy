import type {
  LazadaCredentials,
  LazadaRegion,
  TokenStore,
} from '@mixos-go/lazada-sdk'

/**
 * Konfigurasi adapter Lazada.
 *
 * OAuth/token refresh TIDAK dikelola di sini — semuanya hidup di connector
 * `@mixos-go/lazada-sdk`. Adapter cuma meng-instantiate connector + memakai
 * `getClient(shopId).` Access token Lazada terikat region; pastikan `region`
 * benar per connector.
 */
export interface LazadaAdapterConfig {
  credentials: LazadaCredentials
  redirectUri: string
  region?: LazadaRegion | string
  /** TokenStore dari backend opensellpy (persisten). */
  store: TokenStore
  /** Shop yang dihandle satu instance adapter ini. */
  shopId: string
  /** Sisa waktu (ms) sebelum expiry yang memicu auto-refresh connector. Default 5 mnt. */
  refreshThresholdMs?: number
  /** Custom fetch (testing). */
  fetch?: typeof fetch
}
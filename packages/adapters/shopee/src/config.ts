import type {
  ShopeeCredentials,
  ShopeeEnvironment,
  ShopeeRegion,
  TokenStore,
} from '@mixos-go/shopee-sdk'

/**
 * Konfigurasi adapter Shopee.
 *
 * OAuth/token refresh TIDAK dikelola di sini — semuanya hidup di connector
 * `@mixos-go/shopee-sdk`. Adapter cuma meng-instantiate connector + memakai
 * `getClient(shopId).` `store` biasanya milik backend opensellpy (persisten).
 */
export interface ShopeeAdapterConfig {
  credentials: ShopeeCredentials
  redirectUri: string
  environment?: ShopeeEnvironment
  region?: ShopeeRegion
  /** TokenStore dari backend opensellpy (persisten). */
  store: TokenStore
  /** Shop yang dihandle satu instance adapter ini. */
  shopId: string
  /** Sisa waktu (ms) sebelum expiry yang memicu auto-refresh connector. Default 5 mnt. */
  refreshThresholdMs?: number
  /** Custom fetch (testing). */
  fetch?: typeof fetch
}
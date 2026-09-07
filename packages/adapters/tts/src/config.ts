import type { TikTokCredentials, TokenStore } from '@mixos-go/tiktok-shop-sdk'

/**
 * Konfigurasi adapter TikTok Shop (pasca-merger Tokopedia).
 *
 * OAuth/token refresh hidup di connector `@mixos-go/tiktok-shop-sdk`.
 * Adapter cuma meng-instantiate connector + memakai `getClient(shopId).`
 */
export interface TtsAdapterConfig {
  credentials: TikTokCredentials
  redirectUri: string
  store: TokenStore
  /** Shop yang dihandle satu instance adapter ini. */
  shopId: string
  /** Override base URL (default dokumen resmi TikTok Shop OpenAPI). */
  baseUrl?: string
  /** Override host authorize (default ROW `https://services.tiktokshop.com`). */
  authorizeBaseUrl?: string
  /** Override host token (default `https://auth.tiktok-shops.com`). */
  tokenBaseUrl?: string
  /** Requested scopes/service ids (cross-border) → query `service_ids` (join ';'). */
  serviceIds?: string[]
  /** `shop_cipher` preseed (bila sudah tahu dari Get Authorized Shops / Shop Code). */
  shopCipher?: string
  /** Authorized shop type: `0` = seller, `1` = authorized user. */
  shopType?: number
  /** Kategori token (opsional). */
  category?: string
  /** Sisa waktu (ms) sebelum expiry yang memicu auto-refresh connector. Default 5 mnt. */
  refreshThresholdMs?: number
  /** Custom fetch (testing). */
  fetch?: typeof fetch
}
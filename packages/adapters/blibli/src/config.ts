import type {
  BlibliCredentials,
  BlibliEnvironment,
  TokenStore,
} from '@mixos-go/bli-bli-sdk'

/**
 * Metadata request yang wajib di setiap panggilan Seller API Blibli
 * (requestId, storeCode, username, storeId, channelId).
 */
export interface BlibliRequestMeta {
  /** Store code, mis. `TOQ-15126` (lihat Seller Center → Store Info). */
  storeCode: string
  /** Username Seller Center yang terdaftar untuk API. */
  username: string
  /** Store ID (nilai tetap dari Blibli). */
  storeId: number
  /** Nama channel/company (Seller Aggregator → nama company). */
  channelId: string
}

/**
 * Konfigurasi adapter Blibli.
 *
 * Blibli TIDAK memakai OAuth: auth = HTTP Basic (clientKey:clientSecret) +
 * header `Api-Seller-Key` + optional Signature HMAC. `redirectUri` dipertahankan
 * agar kontrak connector seragam (tidak terpakai di Blibli). Registrasi shop
 * dilakukan otomatis via `connect(shopId, apiSellerKey)` saat adapter dibuat.
 */
export interface BlibliAdapterConfig extends BlibliRequestMeta {
  credentials: BlibliCredentials
  /** Tidak terpakai di Blibli (tanpa OAuth); disyaratkan kontrak connector. */
  redirectUri: string
  /** Shop/seller yang dihandle satu instance adapter ini. */
  shopId: string
  /** TokenStore dari backend opensellpy (persisten). Default: in-memory. */
  store?: TokenStore
  /** Environment host (production/staging). Default `production`. */
  environment?: BlibliEnvironment
  /** Custom fetch (testing). */
  fetch?: typeof fetch
}
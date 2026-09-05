import { TikTokError, type ApiCallSpec, type TikTokClient } from '@mixos-go/tiktok-shop-sdk'

/**
 * Satu panggilan typed ke TikTokClient.request() — envelope TikTok
 * (`{ code, message, data }`) dibuka, `data` di-return.
 *
 * Error non-nol sudah dilempar SDK sebagai `TikTokError`; caller menge-map
 * via `mapTiktokError`.
 */
export async function callRaw<T>(
  client: TikTokClient,
  spec: ApiCallSpec,
  params: Record<string, unknown>,
): Promise<T> {
  const res = (await client.request(spec, params)) as { code: number | string; data?: T }
  return (res.data ?? {}) as T
}

export { TikTokError }
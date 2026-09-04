import {
  ShopeeError,
  type ApiCallSpec,
  type ApiResponse,
  type ShopeeClient,
} from '@mixos-go/shopee-sdk'

/**
 * Satu panggilan typed ke ShopeeClient.request() — response envelope
 * (`{ error, message, response }`) dibuka, `response` di-return.
 *
 * Error non-nol sudah dilempar SDK sebagai `ShopeeError`; caller menge-map
 * via `mapShopeeError`.
 */
export async function callRaw<T>(
  client: ShopeeClient,
  spec: ApiCallSpec,
  params: Record<string, unknown>,
): Promise<T> {
  const res = (await client.request(spec, params)) as ApiResponse<T>
  return (res.response ?? {}) as T
}

export { ShopeeError }
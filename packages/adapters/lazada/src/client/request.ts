import { LazadaError, type LazadaApiResult } from '@mixos-go/lazada-sdk'

/**
 * Buka envelope Lazada (`{ code, message, data }`) — `data` di-return.
 * Error non-nol sudah dilempar SDK sebagai `LazadaError`; caller menge-map
 * via `mapLazadaError`.
 */
export async function callRaw<T>(
  promise: Promise<LazadaApiResult<unknown>>,
): Promise<T> {
  const res = await promise
  return (res.data ?? {}) as T
}

export { LazadaError }
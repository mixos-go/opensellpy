import {
  BlibliError,
  type ApiCallSpec,
  type BlibliClient,
} from '@mixos-go/bli-bli-sdk'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deteksi envelope error Blibli: `{ success: false, errorCode, errorMessage }`
 * (atau `errorCode` terisi meski tanpa flag success). Lempar `BlibliError`
 * agar error terklasifikasi via `mapBlibliError`.
 */
export function assertOk(raw: unknown): void {
  if (raw === null || raw === undefined) return
  if (typeof raw === 'string') {
    throw new BlibliError(`Blibli API mengembalikan non-JSON: ${raw.slice(0, 120)}`, {
      body: raw,
    })
  }
  if (!isRecord(raw)) return
  const success = raw['success']
  const errorCode = raw['errorCode']
  const errorMessage = raw['errorMessage']
  const message = typeof errorMessage === 'string' && errorMessage !== '' ? errorMessage : 'Blibli API error'
  const hasErrorCode = typeof errorCode === 'string' && errorCode !== ''
  if (success === false || (success === undefined && hasErrorCode && typeof errorMessage === 'string')) {
    const code: string | number | undefined =
      typeof errorCode === 'string' || typeof errorCode === 'number' ? errorCode : undefined
    throw new BlibliError(message, {
      ...(code !== undefined ? { code } : {}),
      body: raw,
    })
  }
}

/**
 * Buka envelope Blibli. Sukses V2 = `{ requestId, content }`, mtaapi V1 =
 * `{ requestId, success: true, content|value }`, mutasi (fulfill/stock) =
 * HTTP 204 → `null`. Caller menge-map error via `mapBlibliError`.
 */
export async function callRaw<T>(
  client: BlibliClient,
  spec: ApiCallSpec,
  params: Record<string, unknown>,
): Promise<T> {
  const raw: unknown = await client.request(spec, params)
  assertOk(raw)
  if (raw === null || raw === undefined) return null as T
  if (isRecord(raw)) {
    if (raw['content'] !== undefined) return raw['content'] as T
    if (raw['value'] !== undefined) return raw['value'] as T
  }
  return raw as T
}

export { BlibliError }

/** Envelope mentah Blibli (sebelum unwrap). */
export interface BlibliEnvelope {
  requestId?: string
  content?: unknown
  value?: unknown
  paging?: Record<string, unknown>
  success?: boolean
  errorCode?: string
  errorMessage?: string
}

/**
 * Panggil tanpa unwrap — caller membaca `content`/`value`/`paging` langsung
 * (dipakai endpoint list yang butuh metadata `paging`). Mutasi 204 → {}.
 */
export async function callEnvelope(
  client: BlibliClient,
  spec: ApiCallSpec,
  params: Record<string, unknown>,
): Promise<BlibliEnvelope> {
  const raw: unknown = await client.request(spec, params)
  assertOk(raw)
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as BlibliEnvelope
  }
  return {}
}
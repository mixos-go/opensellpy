/** Normalisasi header HTTP menjadi kunci lowercase (akses konsisten). */
export function normalizeWebhookHeaders(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    out[key.toLowerCase()] = value
  }
  return out
}

/**
 * Parse raw body webhook menjadi JSON object. Body webhook semuanya objek
 * persis seperti diterima — JSON.parse di sini untuk membaca field, BUKAN
 * untuk menggantikan rawBody pada perhitungan signature.
 */
export function parseWebhookJsonBody(rawBody: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch (err: unknown) {
    throw new Error(`Webhook body bukan JSON valid: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Webhook body harus berupa JSON object')
  }
  return parsed as Record<string, unknown>
}

/**
 * Normalisasi epoch → ISO. Auto-detect mili vs detik (dipakai update_time
 * yang konsistensinya beda-beda per platform).
 */
export function epochToIso(value: number): string {
  const ms = value > 1_000_000_000_000 ? value : value * 1000
  return new Date(ms).toISOString()
}
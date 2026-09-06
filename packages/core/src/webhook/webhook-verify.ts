import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/** HMAC-SHA256 hex (huruf kecil) atas `message` dengan kunci `secret`. */
export function computeHmacHex(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

/** MD5 hex (huruf kecil) — dipakai kembali oleh layering signature Blibli. */
export function computeMd5Hex(message: string): string {
  return createHash('md5').update(message, 'utf8').digest('hex')
}

/** Perbandingan hex constant-time (panjang beda → langsung false). */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'latin1'), Buffer.from(b, 'latin1'))
}
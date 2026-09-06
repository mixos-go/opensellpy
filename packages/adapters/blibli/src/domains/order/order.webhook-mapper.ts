import {
  type IWebhookHandler,
  type WebhookOrderEvent,
  type WebhookRequest,
  type WebhookSignatureResult,
  computeHmacHex,
  computeMd5Hex,
  epochToIso,
  normalizeWebhookHeaders,
  parseWebhookJsonBody,
  safeEqualHex,
} from '@opensellpy/core'
import { fromBlibliOrderStatus } from './order.status-map.js'

const WIB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const WIB_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/**
 * Format tanggal WIB (UTC+7) ala pola Java `EEE MMM dd HH:mm:ss zzz yyyy`
 * yang dipakai Blibli pada raw signature webhook. Deterministik & bisa
 * direplikasi dari `requestTime` (ms).
 */
export function formatBlibliWibDate(requestTimeMs: number): string {
  const date = new Date(requestTimeMs + 7 * 60 * 60 * 1000)
  const pad = (value: number): string => String(value).padStart(2, '0')
  const weekday = WIB_DAYS[date.getUTCDay()]
  const month = WIB_MONTHS[date.getUTCMonth()]
  const day = pad(date.getUTCDate())
  const hours = pad(date.getUTCHours())
  const minutes = pad(date.getUTCMinutes())
  const seconds = pad(date.getUTCSeconds())
  return `${weekday} ${month} ${day} ${hours}:${minutes}:${seconds} WIB ${date.getUTCFullYear()}`
}

/**
 * Build raw signature webhook Blibli:
 * ```
 * POST
 * {md5hex(body)}
 * {content-type}
 * {date WIB}
 * {callback URL}
 * ```
 * Dipakai test & debugging (dan oleh partner yang ingin mereplikasi).
 */
export function buildBlibliWebhookRawString(
  rawBody: string,
  contentType: string,
  date: string,
  callbackUrl: string,
): string {
  return `POST\n${computeMd5Hex(rawBody)}\n${contentType}\n${date}\n${callbackUrl}`
}

/**
 * Compute signature header `signature` versi hex Blibli
 * (HMAC-SHA256 key atas raw string). Blibli juga terlihat memakai charset
 * base64 pada sampel — verify handler menerima keduanya.
 */
export function computeBlibliWebhookSignature(key: string, rawString: string): string {
  return computeHmacHex(key, rawString)
}

const CREATED_STATUSES: ReadonlySet<string> = new Set(['FP'])

interface RawBlibliOrderEvent {
  orderId?: string | number
  orderItemId?: string | number
  orderStatus?: string
  timestamp?: number
}

/** Opsi konstruksi handler webhook order Blibli. */
export interface BlibliWebhookOptions {
  /** Webhook Signature Key (opsional). Tanpa key, verifikasi dilewati. */
  signatureKey?: string
  /** Callback base path (untuk signature bila `url` tidak tersedia). Optional. */
  callbackUrl?: string
}

/**
 * Webhook handler order Blibli (Seller API — Webhook Order, body FLAT, tanpa
 * envelope). Signature OPSIONAL: bila `signatureKey` tidak dikonfigurasi,
 * verifikasi lulus dengan catatan (Blibli mengirim callback tidak bertanda
 * tanda tangan). Status `FP` → event created; lainnya status_changed.
 * Payload returned_order (RMA) & non-order dilewati Fase 9.
 */
export class BlibliWebhookHandler implements IWebhookHandler {
  readonly platform = 'blibli' as const
  private readonly signatureKey: string | undefined
  private readonly fallbackCallbackUrl: string | undefined

  constructor(options: BlibliWebhookOptions) {
    this.signatureKey = options.signatureKey
    this.fallbackCallbackUrl = options.callbackUrl
  }

  async verifySignature(request: WebhookRequest): Promise<WebhookSignatureResult> {
    if (this.signatureKey === undefined) {
      return { valid: true, reason: 'Webhook Signature Key tidak dikonfigurasi — verifikasi dilewati' }
    }
    const headers = normalizeWebhookHeaders(request.headers)
    const actual = headers['signature'] ?? ''
    if (actual === '') {
      return { valid: false, reason: 'Header signature tidak ada (Signature Key aktif tapi callback tak ditandai)' }
    }
    const url = request.url ?? this.fallbackCallbackUrl ?? ''
    if (url === '') {
      return { valid: false, reason: 'WebhookRequest.url (callback URL) wajib untuk verifikasi Blibli' }
    }

    const requestTime = actualRequestTimeHeader(headers)
    if (requestTime === undefined) {
      return { valid: false, reason: 'Header requestTime tidak ada untuk membangun tanggal signature' }
    }
    const date = formatBlibliWibDate(requestTime)
    const contentType = headers['content-type'] ?? ''
    const rawString = buildBlibliWebhookRawString(request.rawBody, contentType, date, url)

    // Blibli memakai representasi hex atau base64 — terima keduanya.
    const expectedHex = computeBlibliWebhookSignature(this.signatureKey, rawString)
    if (!safeEqualHex(expectedHex, actual) && !safeEqualHex(expectedHex, Buffer.from(actual, 'base64').toString('hex'))) {
      return { valid: false, reason: 'Signature tidak cocok (signature key / raw string / tanggal)' }
    }
    return { valid: true }
  }

  parse(request: WebhookRequest): WebhookOrderEvent[] {
    const body = parseWebhookJsonBody(request.rawBody) as RawBlibliOrderEvent
    const rawStatus = body.orderStatus ?? ''
    const orderItemId = body.orderItemId === undefined ? '' : String(body.orderItemId)
    // Payload non-order (returned_order RMA, product, dll.) → bukan order status.
    if (orderItemId === '' || rawStatus === '') return []
    const platformOrderId = body.orderId === undefined ? '' : String(body.orderId)
    const status = fromBlibliOrderStatus(rawStatus)
    const occurredAt = epochToIso(body.timestamp ?? 0)
    const eventId = `${orderItemId}:${rawStatus}:${String(body.timestamp ?? '')}`
    if (CREATED_STATUSES.has(rawStatus)) {
      return [{ kind: 'order.created', eventId, occurredAt, orderId: orderItemId, platformOrderId, status, raw: body }]
    }
    return [{ kind: 'order.status_changed', eventId, occurredAt, orderId: orderItemId, platformOrderId, status, raw: body }]
  }
}

function actualRequestTimeHeader(headers: Record<string, string>): number | undefined {
  const raw = headers['requesttime']
  if (raw === undefined || raw === '') return undefined
  const ms = Number(raw)
  return Number.isFinite(ms) && ms > 0 ? ms : undefined
}
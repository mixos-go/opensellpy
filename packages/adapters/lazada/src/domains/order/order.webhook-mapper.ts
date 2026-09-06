import {
  type IWebhookHandler,
  type WebhookOrderEvent,
  type WebhookRequest,
  type WebhookSignatureResult,
  computeHmacHex,
  epochToIso,
  normalizeWebhookHeaders,
  parseWebhookJsonBody,
  safeEqualHex,
} from '@opensellpy/core'
import { fromLazadaOrderStatus } from './order.status-map.js'

/**
 * Compute signature header `Authorization` Lazada Push Mechanism:
 * `hex(HMAC-SHA256(app_secret, rawBody))`. Dipakai test & debugging.
 */
export function computeLazadaWebhookSignature(appSecret: string, rawBody: string): string {
  return computeHmacHex(appSecret, rawBody)
}

/** Status awal Lazada yang menandakan order baru (vs transisi status). */
const CREATED_STATUSES: ReadonlySet<string> = new Set(['unpaid', 'pending', 'topack', 'toship'])

interface RawLazadaPushData {
  order_status?: string
  trade_order_id?: number | string
  trade_order_line_id?: number | string
  status_update_time?: number
  buyer_id?: number | string
}

interface RawLazadaPushEnvelope {
  seller_id?: number | string
  message_type?: number
  data?: RawLazadaPushData
  timestamp?: number
  site?: string
}

/** Opsi konstruksi handler webhook order Lazada. */
export interface LazadaWebhookOptions {
  /** `app_secret` — kunci HMAC verifikasi push. */
  appSecret: string
}

/**
 * Webhook handler order Lazada Push (LPM — `message_type: 0` forward order).
 * - verify: HMAC-SHA256(app_secret, rawBody) di header `Authorization`.
 * - parse: hanya message_type 0; idempotency key dari line id + status + waktu.
 *   `message_type` reverse (return/refund/cancel) belum dinormalisasi Fase 9.
 */
export class LazadaWebhookHandler implements IWebhookHandler {
  readonly platform = 'lazada' as const
  private readonly appSecret: string

  constructor(options: LazadaWebhookOptions) {
    this.appSecret = options.appSecret
  }

  async verifySignature(request: WebhookRequest): Promise<WebhookSignatureResult> {
    const headers = normalizeWebhookHeaders(request.headers)
    const expected = computeLazadaWebhookSignature(this.appSecret, request.rawBody)
    const actual = headers['authorization'] ?? ''
    if (!safeEqualHex(expected, actual)) {
      return { valid: false, reason: 'Signature Authorization tidak cocok (app_secret / raw body)' }
    }
    return { valid: true }
  }

  parse(request: WebhookRequest): WebhookOrderEvent[] {
    const body = parseWebhookJsonBody(request.rawBody) as RawLazadaPushEnvelope
    if (body.message_type !== 0 || body.data === undefined) return []
    const raw = body.data
    const orderId = raw.trade_order_line_id === undefined ? '' : String(raw.trade_order_line_id)
    const platformOrderId = raw.trade_order_id === undefined ? '' : String(raw.trade_order_id)
    const rawStatus = raw.order_status ?? ''
    if (orderId === '' || rawStatus === '') {
      throw new Error('Payload push order Lazada tidak lengkap (trade_order_line_id/order_status)')
    }
    const status = fromLazadaOrderStatus(rawStatus)
    const occurredAt = epochToIso(raw.status_update_time ?? body.timestamp ?? 0)
    const eventId = `${orderId}:${rawStatus}:${String(raw.status_update_time ?? '')}`
    if (CREATED_STATUSES.has(rawStatus)) {
      return [{ kind: 'order.created', eventId, occurredAt, orderId, platformOrderId, status, raw }]
    }
    return [{ kind: 'order.status_changed', eventId, occurredAt, orderId, platformOrderId, status, raw }]
  }
}
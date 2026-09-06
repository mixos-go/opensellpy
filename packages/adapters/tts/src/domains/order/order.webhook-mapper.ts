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
} from '@mixos-go/opensellpy-core'
import { fromTiktokOrderStatus } from './order.status-map.js'

/**
 * Compute signature header `Authorization` yang dikirim TikTok Shop:
 * `hex(HMAC-SHA256(app_secret, "${app_key}${rawBody}"))` — base string KOMPAK
 * tanpa spasi/separator. Dipakai test & debugging.
 */
export function computeTiktokWebhookSignature(appKey: string, appSecret: string, rawBody: string): string {
  return computeHmacHex(appSecret, `${appKey}${rawBody}`)
}

/** Status awal TikTok yang menandakan order baru (vs transisi status). */
const CREATED_STATUSES: ReadonlySet<string> = new Set(['UNPAID', 'ON_HOLD'])

interface RawTiktokPushData {
  order_id?: string
  order_status?: string
  is_on_hold_order?: boolean
  update_time?: number
}

interface RawTiktokPushEnvelope {
  type?: number
  tts_notification_id?: string
  shop_id?: string
  timestamp?: number
  data?: RawTiktokPushData
}

/** Opsi konstruksi handler webhook order TikTok Shop. */
export interface TiktokWebhookOptions {
  /** `app_key` — segmen pertama base string signature. */
  appKey: string
  /** `app_secret` — kunci HMAC verifikasi. */
  appSecret: string
}

/**
 * Webhook handler order TikTok Shop (`type: 1` — order status change).
 * - verify: HMAC-SHA256(app_secret, app_key + rawBody) di header `Authorization`.
 * - parse: dedup by `tts_notification_id`; status awal → created, lainnya status_changed.
 */
export class TiktokWebhookHandler implements IWebhookHandler {
  readonly platform = 'tts' as const
  private readonly appKey: string
  private readonly appSecret: string

  constructor(options: TiktokWebhookOptions) {
    this.appKey = options.appKey
    this.appSecret = options.appSecret
  }

  async verifySignature(request: WebhookRequest): Promise<WebhookSignatureResult> {
    const headers = normalizeWebhookHeaders(request.headers)
    const expected = computeTiktokWebhookSignature(this.appKey, this.appSecret, request.rawBody)
    const actual = headers['authorization'] ?? ''
    if (!safeEqualHex(expected, actual)) {
      return { valid: false, reason: 'Signature Authorization tidak cocok (app_secret / app_key / raw body)' }
    }
    return { valid: true }
  }

  parse(request: WebhookRequest): WebhookOrderEvent[] {
    const body = parseWebhookJsonBody(request.rawBody) as RawTiktokPushEnvelope
    if (body.type !== 1 || body.data === undefined) return []
    const raw = body.data
    const orderId = raw.order_id ?? ''
    const rawStatus = raw.order_status ?? ''
    if (orderId === '' || rawStatus === '') {
      throw new Error('Payload order status TikTok tidak lengkap (order_id/order_status)')
    }
    const status = fromTiktokOrderStatus(rawStatus)
    const occurredAt = epochToIso(raw.update_time ?? body.timestamp ?? 0)
    const eventId = body.tts_notification_id ?? `${orderId}:${rawStatus}:${String(raw.update_time ?? '')}`
    if (CREATED_STATUSES.has(rawStatus)) {
      return [{ kind: 'order.created', eventId, occurredAt, orderId, platformOrderId: orderId, status, raw }]
    }
    return [{ kind: 'order.status_changed', eventId, occurredAt, orderId, platformOrderId: orderId, status, raw }]
  }
}
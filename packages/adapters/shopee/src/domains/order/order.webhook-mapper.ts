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
import { fromShopeeOrderStatus } from './order.status-map.js'

/**
 * Compute signature header `Authorization` yang dikirim Shopee:
 * `hex(HMAC-SHA256(partner_key, "${callbackUrl}|${rawBody}"))`.
 * Dipakai test & debugging (bukan untuk signing outgoing).
 */
export function computeShopeeWebhookSignature(partnerKey: string, callbackUrl: string, rawBody: string): string {
  return computeHmacHex(partnerKey, `${callbackUrl}|${rawBody}`)
}

/** Status awal Shopee yang menandakan order baru (vs transisi status). */
const CREATED_STATUSES: ReadonlySet<string> = new Set(['UNPAID', 'PENDING'])

interface RawShopeePushData {
  ordersn?: string
  status?: string
  update_time?: number
}

interface RawShopeePushEnvelope {
  code?: number
  shop_id?: number
  timestamp?: number
  data?: RawShopeePushData
}

/** Opsi konstruksi handler webhook order Shopee. */
export interface ShopeeWebhookOptions {
  /** `partner_key` (kunci HMAC verifikasi push). */
  partnerKey: string
}

/**
 * Webhook handler order Shopee (Push Mechanism v2 — Order Status Update, code 3).
 * - verify: HMAC-SHA256(partner_key, url + "|" + rawBody) di header `Authorization`.
 * - parse: hanya code 3 yg diproses; status awal → event created, lainnya status_changed.
 */
export class ShopeeWebhookHandler implements IWebhookHandler {
  readonly platform = 'shopee' as const
  private readonly partnerKey: string

  constructor(options: ShopeeWebhookOptions) {
    this.partnerKey = options.partnerKey
  }

  async verifySignature(request: WebhookRequest): Promise<WebhookSignatureResult> {
    if (request.url === undefined || request.url === '') {
      return { valid: false, reason: 'WebhookRequest.url (callback URL) wajib untuk verifikasi Shopee' }
    }
    const headers = normalizeWebhookHeaders(request.headers)
    const expected = computeShopeeWebhookSignature(this.partnerKey, request.url, request.rawBody)
    const actual = headers['authorization'] ?? ''
    if (!safeEqualHex(expected, actual)) {
      return { valid: false, reason: 'Signature Authorization tidak cocok (partner_key / callbackUrl / raw body)' }
    }
    return { valid: true }
  }

  parse(request: WebhookRequest): WebhookOrderEvent[] {
    const body = parseWebhookJsonBody(request.rawBody) as RawShopeePushEnvelope
    if (body.code !== 3 || body.data === undefined) return []
    const raw = body.data
    const orderId = raw.ordersn ?? ''
    const rawStatus = raw.status ?? ''
    if (orderId === '' || rawStatus === '') {
      throw new Error('Payload Order Status Update Shopee tidak lengkap (ordersn/status)')
    }
    const status = fromShopeeOrderStatus(rawStatus)
    const occurredAt = epochToIso(raw.update_time ?? body.timestamp ?? 0)
    const eventId = `${orderId}:${rawStatus}:${String(raw.update_time ?? '')}`
    const base = {
      eventId,
      occurredAt,
      orderId,
      platformOrderId: orderId,
      status,
      raw,
    }
    if (CREATED_STATUSES.has(rawStatus)) {
      return [{ kind: 'order.created', ...base }]
    }
    return [{ kind: 'order.status_changed', ...base }]
  }
}
import type { PlatformKey } from '../platform/platform-key.js'
import type { OrderStatus } from '../domains/order/order.types.js'

/**
 * Representasi webhook callback yang mendarat di endpoint partner.
 * `rawBody` WAJIB string persis seperti diterima jaringan — verifikasi
 * signature Shopee/TikTok/Lazada menghitung HMAC atas raw body, bukan atas
 * objek hasil JSON.parse (whitespace & urutan key ikut dihitung).
 */
export interface WebhookRequest {
  /** Raw HTTP body string persis seperti diterima (wajib utk verifikasi signature). */
  rawBody: string
  /** Header HTTP dengan kunci lowercase (normalisasi dilakukan adapter). */
  headers: Record<string, string>
  /** URL callback lengkap yang dipanggil platform. Dibutuhkan Shopee utk base string. */
  url?: string
}

export interface WebhookSignatureResult {
  valid: boolean
  /** Alasan saat `valid: false` (atau catatan saat verifikasi dilewati). */
  reason?: string
}

/** Event order baru (created) hasil normalisasi webhook. */
export interface WebhookOrderCreated {
  kind: 'order.created'
  /** Idempotency key (gabungan id + status + timestamp platform). */
  eventId: string
  /** ISO timestamp kejadian. */
  occurredAt: string
  /** Id order domain opensellpy (semantik per adapter). */
  orderId: string
  /** Id order asli platform. */
  platformOrderId: string
  status: OrderStatus
  raw: unknown
}

/** Event perubahan status order hasil normalisasi webhook. */
export interface WebhookOrderStatusChanged {
  kind: 'order.status_changed'
  /** Idempotency key (gabungan id + status + timestamp platform). */
  eventId: string
  /** ISO timestamp kejadian. */
  occurredAt: string
  /** Id order domain opensellpy (semantik per adapter). */
  orderId: string
  /** Id order asli platform. */
  platformOrderId: string
  status: OrderStatus
  /** Status sebelumnya bila payload webhook menyediakannya (sebagian platform tidak). */
  previousStatus?: OrderStatus
  raw: unknown
}

export type WebhookOrderEvent = WebhookOrderCreated | WebhookOrderStatusChanged

/**
 * Contract webhook per platform: verifikasi signature + normalisasi payload
 * menjadi event domain. Handler diinstansiasi adapter dengan kredensial
 * signature (partnerKey/appSecret/signatureKey); konsumen memanggil
 * `verifySignature` dulu, lalu `parse`.
 */
export interface IWebhookHandler {
  readonly platform: PlatformKey
  verifySignature(request: WebhookRequest): Promise<WebhookSignatureResult>
  parse(request: WebhookRequest): WebhookOrderEvent[]
}
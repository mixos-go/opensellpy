import type { IWebhookHandler, WebhookRequest } from '@mixos-go/opensellpy-core'
import {
  ShopeeWebhookHandler,
  computeShopeeWebhookSignature,
} from '@mixos-go/opensellpy-adapter-shopee'
import {
  TiktokWebhookHandler,
  computeTiktokWebhookSignature,
} from '@mixos-go/opensellpy-adapter-tts'
import {
  LazadaWebhookHandler,
  computeLazadaWebhookSignature,
} from '@mixos-go/opensellpy-adapter-lazada'
import {
  BlibliWebhookHandler,
  buildBlibliWebhookRawString,
  computeBlibliWebhookSignature,
  formatBlibliWibDate,
} from '@mixos-go/opensellpy-adapter-blibli'
import { renderWebhookEvents } from './render.js'

interface WebhookDemoCase {
  handler: IWebhookHandler
  request: WebhookRequest
}

const PARTNER_KEY = 'demo-partner-key'
const APP_KEY = 'demo-app-key'
const APP_SECRET = 'demo-app-secret'
const LAZADA_SECRET = 'demo-lazada-secret'
const SIGNATURE_KEY = 'demo-blibli-secret'
const CALLBACK_URL = 'https://omni.example.com/webhook'

const SHOPEE_BODY = JSON.stringify({
  data: { ordersn: '220810QSK8S7BX', status: 'READY_TO_SHIP', items: [], update_time: 1660123127 },
  shop_id: 727720655,
  code: 3,
  timestamp: 1660123127,
})

const TTS_BODY = JSON.stringify({
  type: 1,
  tts_notification_id: '7327112393057371910',
  shop_id: '7494049642642441621',
  timestamp: 1644412885,
  data: { order_id: '576486316948490001', order_status: 'ON_HOLD', is_on_hold_order: false, update_time: 1644412885 },
})

const LAZADA_BODY = JSON.stringify({
  seller_id: 400606482963,
  message_type: 0,
  data: {
    order_status: 'shipped',
    trade_order_id: 1250905272558269,
    trade_order_line_id: 1250905273458269,
    status_update_time: 1694620790,
    buyer_id: 410404458269,
  },
  timestamp: 1694620800,
  site: 'lazada_id',
})

const BLIBLI_BODY = JSON.stringify({
  blibliSku: 'TOQ-15126-00298-00001',
  quantity: 7,
  orderId: '12104566234',
  initialQuantity: 10,
  orderItemId: '121072766613',
  packageId: '10025702',
  orderStatus: 'D',
  logisticProductCode: 'RegularCode',
  logisticProductName: 'Regular',
  sellerSku: 'SAMS-SKU-01',
  timestamp: 1537149303013,
  storeCode: 'TOQ-15126',
})

/** Bangun 1 kasus webhook per platform: handler real + request bertanda tangan. */
export function buildWebhookDemoCases(): WebhookDemoCase[] {
  const shopeeRequest: WebhookRequest = {
    rawBody: SHOPEE_BODY,
    headers: {
      authorization: computeShopeeWebhookSignature(PARTNER_KEY, CALLBACK_URL, SHOPEE_BODY),
      'content-type': 'application/json',
    },
    url: CALLBACK_URL,
  }

  const ttsRequest: WebhookRequest = {
    rawBody: TTS_BODY,
    headers: {
      authorization: computeTiktokWebhookSignature(APP_KEY, APP_SECRET, TTS_BODY),
      'content-type': 'application/json',
    },
  }

  const lazadaRequest: WebhookRequest = {
    rawBody: LAZADA_BODY,
    headers: {
      authorization: computeLazadaWebhookSignature(LAZADA_SECRET, LAZADA_BODY),
      'content-type': 'application/json',
    },
  }

  const requestTime = 1537149303013
  const blibliDate = formatBlibliWibDate(requestTime)
  const blibliRawString = buildBlibliWebhookRawString(BLIBLI_BODY, 'application/json', blibliDate, CALLBACK_URL)
  const blibliRequest: WebhookRequest = {
    rawBody: BLIBLI_BODY,
    headers: {
      'content-type': 'application/json',
      requestid: 'f8127be2-1da4-4e65-9280-42137d0d80ed',
      requesttime: String(requestTime),
      signature: computeBlibliWebhookSignature(SIGNATURE_KEY, blibliRawString),
    },
    url: CALLBACK_URL,
  }

  return [
    { handler: new ShopeeWebhookHandler({ partnerKey: PARTNER_KEY }), request: shopeeRequest },
    { handler: new TiktokWebhookHandler({ appKey: APP_KEY, appSecret: APP_SECRET }), request: ttsRequest },
    { handler: new LazadaWebhookHandler({ appSecret: LAZADA_SECRET }), request: lazadaRequest },
    { handler: new BlibliWebhookHandler({ signatureKey: SIGNATURE_KEY }), request: blibliRequest },
  ]
}

/** Jalankan verifikasi + parse untuk seluruh kasus, return blok teks hasil. */
export async function runWebhookDemo(): Promise<string> {
  const lines: string[] = ['', '## Webhook — verifySignature + parse (Fase 9)']
  for (const { handler, request } of buildWebhookDemoCases()) {
    const check = await handler.verifySignature(request)
    const label = check.valid ? 'VALID' : `INVALID (${check.reason ?? ''})`
    lines.push(`  ${handler.platform} signature → ${label}`)
    lines.push(renderWebhookEvents(handler.platform, handler.parse(request)))
  }
  return lines.join('\n')
}
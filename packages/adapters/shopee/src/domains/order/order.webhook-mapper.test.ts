import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WebhookRequest } from '@opensellpy/core'
import { computeShopeeWebhookSignature, ShopeeWebhookHandler } from './order.webhook-mapper.js'

const PARTNER_KEY = 'secret-partner-key'
const CALLBACK_URL = 'https://omni.example.com/webhook/shopee'
const RAW_BODY = JSON.stringify({
  data: { ordersn: '220810QSK8S7BX', status: 'PROCESSED', completed_scenario: '', items: [], update_time: 1660123127 },
  shop_id: 727720655,
  code: 3,
  timestamp: 1660123127,
})

function request(rawBody: string = RAW_BODY): WebhookRequest {
  return {
    rawBody,
    headers: {
      authorization: computeShopeeWebhookSignature(PARTNER_KEY, CALLBACK_URL, rawBody),
      'content-type': 'application/json',
    },
    url: CALLBACK_URL,
  }
}

test('Shopee verifySignature: valid utk signature benar, invalid utk signature salah/url hilang', async () => {
  const handler = new ShopeeWebhookHandler({ partnerKey: PARTNER_KEY })

  const ok = await handler.verifySignature(request())
  assert.equal(ok.valid, true)

  const tampered = request()
  tampered.headers['authorization'] = 'deadbeef'
  const bad = await handler.verifySignature(tampered)
  assert.equal(bad.valid, false)
  assert.match(bad.reason ?? '', /Authorization/i)

  const noUrl = request()
  delete noUrl.url
  const noUrlRes = await handler.verifySignature(noUrl)
  assert.equal(noUrlRes.valid, false)
  assert.match(noUrlRes.reason ?? '', /url/i)

  const noSignature = await handler.verifySignature({ ...request(), headers: {} })
  assert.equal(noSignature.valid, false)
})

test('Shopee parse: code 3 PROCESSED → order.status_changed ready-to-ship (+ eventId stabil)', () => {
  const handler = new ShopeeWebhookHandler({ partnerKey: PARTNER_KEY })

  const first = handler.parse(request())[0]
  assert.ok(first)
  assert.equal(first.kind, 'order.status_changed')
  assert.equal(first.orderId, '220810QSK8S7BX')
  assert.equal(first.platformOrderId, '220810QSK8S7BX')
  assert.equal(first.status, 'ready-to-ship')
  assert.equal(first.occurredAt, new Date(1660123127 * 1000).toISOString())
  assert.equal(first.eventId, '220810QSK8S7BX:PROCESSED:1660123127')

  const second = handler.parse(request())[0]
  assert.ok(second)
  assert.equal(second.eventId, first.eventId)
})

test('Shopee parse: status UNPAID → order.created; kode != 3 atau tanpa data → []', () => {
  const handler = new ShopeeWebhookHandler({ partnerKey: PARTNER_KEY })

  const createdBody = RAW_BODY.replace('"status":"PROCESSED"', '"status":"UNPAID"')
  const created = handler.parse(request(createdBody))[0]
  assert.ok(created)
  assert.equal(created.kind, 'order.created')
  assert.equal(created.status, 'pending')

  const otherCode = request(RAW_BODY.replace('"code":3', '"code":1'))
  assert.deepEqual(handler.parse(otherCode), [])
})

test('Shopee parse: exception untuk payload malformed', () => {
  const handler = new ShopeeWebhookHandler({ partnerKey: PARTNER_KEY })
  assert.throws(() => handler.parse(request('{not-json')), /JSON/i)
})
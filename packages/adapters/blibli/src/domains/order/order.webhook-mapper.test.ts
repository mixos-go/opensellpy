import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WebhookRequest } from '@mixos-go/opensellpy-core'
import {
  BlibliWebhookHandler,
  buildBlibliWebhookRawString,
  computeBlibliWebhookSignature,
  formatBlibliWibDate,
} from './order.webhook-mapper.js'

const SIGNATURE_KEY = 'blibli-webhook-secret'
const CALLBACK_URL = 'https://omni.example.com/receiver/newOrder/regular'
const CONTENT_TYPE = 'application/json'
const REQUEST_TIME = 1537149303013
const RAW_BODY = JSON.stringify({
  blibliSku: 'TOQ-15126-00298-00001',
  quantity: 7,
  orderId: '12104566234',
  initialQuantity: 10,
  orderItemId: '121072766613',
  packageId: '10025702',
  orderStatus: 'FP',
  logisticProductCode: 'RegularCode',
  logisticProductName: 'Regular',
  blibliSkuName: 'Sunglasses Police',
  autoCancelTimeStamp: '2019-07-25 00:00',
  sellerSku: 'SAMS-SKU-01',
  orderDate: 1539684887059,
  timestamp: 1537149303013,
  storeCode: 'TOQ-15126',
})

function buildSignatureHeader(): string {
  const date = formatBlibliWibDate(REQUEST_TIME)
  const raw = buildBlibliWebhookRawString(RAW_BODY, CONTENT_TYPE, date, CALLBACK_URL)
  return computeBlibliWebhookSignature(SIGNATURE_KEY, raw)
}

function request(body: string = RAW_BODY, headers: Record<string, string> = {}): WebhookRequest {
  const signature = headers['signature'] ?? buildSignatureHeader()
  return {
    rawBody: body,
    headers: {
      accept: 'application/json',
      'content-type': CONTENT_TYPE,
      requestid: 'f8127be2-1da4-4e65-9280-42137d0d80ed',
      requesttime: String(REQUEST_TIME),
      signature,
      ...headers,
    },
    url: CALLBACK_URL,
  }
}

test('Blibli formatBlibliWibDate mengikuti pola Java EEE MMM dd HH:mm:ss zzz yyyy', () => {
  // 14:07:15 WIB = 07:07:15 UTC pada 2016-05-16
  const ms = Date.UTC(2016, 4, 16, 7, 7, 15)
  assert.equal(formatBlibliWibDate(ms), 'Mon May 16 14:07:15 WIB 2016')
})

test('Blibli verifySignature: valid utk signature benar (hex); dilewati tanpa signatureKey', async () => {
  const handler = new BlibliWebhookHandler({ signatureKey: SIGNATURE_KEY })

  const ok = await handler.verifySignature(request())
  assert.equal(ok.valid, true)

  const unsigned = new BlibliWebhookHandler({})
  const skip = await unsigned.verifySignature(request())
  assert.equal(skip.valid, true)
  assert.match(skip.reason ?? '', /dilewati/i)
})

test('Blibli verifySignature: invalid utk salah key, salah uri, tanpa header signature/requestTime/url', async () => {
  const handler = new BlibliWebhookHandler({ signatureKey: SIGNATURE_KEY })

  const wrongKey = await handler.verifySignature(request(RAW_BODY, { signature: 'deadbeef' }))
  assert.equal(wrongKey.valid, false)

  const wrongUrl = request()
  wrongUrl.url = 'https://evil.example.com/receiver/newOrder/regular'
  const wrongUrlRes = await handler.verifySignature(wrongUrl)
  assert.equal(wrongUrlRes.valid, false)
  assert.match(wrongUrlRes.reason ?? '', /tidak cocok/i)

  const noUrl = request()
  delete noUrl.url
  const noUrlRes = await handler.verifySignature(noUrl)
  assert.equal(noUrlRes.valid, false)

  const noSignature = request(RAW_BODY, {})
  delete noSignature.headers['signature']
  const noSigRes = await handler.verifySignature(noSignature)
  assert.equal(noSigRes.valid, false)

  const noTime = request(RAW_BODY, {})
  delete noTime.headers['requesttime']
  const noTimeRes = await handler.verifySignature(noTime)
  assert.equal(noTimeRes.valid, false)
  assert.match(noTimeRes.reason ?? '', /requestTime/i)
})

test('Blibli parse: FP → order.created ready-to-ship; D → status_changed delivered', () => {
  const handler = new BlibliWebhookHandler({ signatureKey: SIGNATURE_KEY })

  const created = handler.parse(request())[0]
  assert.ok(created)
  assert.equal(created.kind, 'order.created')
  assert.equal(created.orderId, '121072766613')
  assert.equal(created.platformOrderId, '12104566234')
  assert.equal(created.status, 'ready-to-ship')
  assert.equal(created.occurredAt, new Date(1537149303013).toISOString())
  assert.equal(created.eventId, '121072766613:FP:1537149303013')

  const deliveredBody = RAW_BODY.replace('"orderStatus":"FP"', '"orderStatus":"D"').replace(
    '"timestamp":1537149303013',
    '"timestamp":1537149304000',
  )
  const delivered = handler.parse(request(deliveredBody))[0]
  assert.ok(delivered)
  assert.equal(delivered.kind, 'order.status_changed')
  assert.equal(delivered.status, 'delivered')
})

test('Blibli parse: payload non-order (RMA returned, tanpa orderStatus/orderItemId) → []', () => {
  const handler = new BlibliWebhookHandler({ signatureKey: SIGNATURE_KEY })
  const rmaBody = JSON.stringify({ returnId: '5b5b0149638c4f102c53c271', rmaNumber: 'RMA30779', status: 'WAITING_APPROVAL' })
  assert.deepEqual(handler.parse(request(rmaBody)), [])
})
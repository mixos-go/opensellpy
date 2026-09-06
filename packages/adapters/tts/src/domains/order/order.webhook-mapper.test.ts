import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WebhookRequest } from '@mixos-go/opensellpy-core'
import { computeTiktokWebhookSignature, TiktokWebhookHandler } from './order.webhook-mapper.js'

const APP_KEY = 'app-key-tts'
const APP_SECRET = 'app-secret-tts'
const RAW_BODY = JSON.stringify({
  type: 1,
  tts_notification_id: '7327112393057371910',
  shop_id: '7494049642642441621',
  timestamp: 1644412885,
  data: {
    order_id: '576486316948490001',
    order_status: 'UNPAID',
    is_on_hold_order: false,
    update_time: 1644412885,
  },
})

function request(rawBody: string = RAW_BODY): WebhookRequest {
  return {
    rawBody,
    headers: {
      authorization: computeTiktokWebhookSignature(APP_KEY, APP_SECRET, rawBody),
      'content-type': 'application/json',
    },
  }
}

test('TTS verifySignature: valid utk signature benar, invalid utk salah', async () => {
  const handler = new TiktokWebhookHandler({ appKey: APP_KEY, appSecret: APP_SECRET })

  const ok = await handler.verifySignature(request())
  assert.equal(ok.valid, true)

  const tampered = request()
  tampered.headers['authorization'] = 'deadbeef'
  const bad = await handler.verifySignature(tampered)
  assert.equal(bad.valid, false)
  assert.match(bad.reason ?? '', /Authorization/i)

  const wrongSecret = await handler.verifySignature({ ...request(), headers: {} })
  assert.equal(wrongSecret.valid, false)
})

test('TTS parse: UNPAID → order.created; eventId dedup = tts_notification_id', () => {
  const handler = new TiktokWebhookHandler({ appKey: APP_KEY, appSecret: APP_SECRET })

  const first = handler.parse(request())[0]
  assert.ok(first)
  assert.equal(first.kind, 'order.created')
  assert.equal(first.orderId, '576486316948490001')
  assert.equal(first.platformOrderId, '576486316948490001')
  assert.equal(first.status, 'pending')
  assert.equal(first.eventId, '7327112393057371910')
  assert.equal(first.occurredAt, new Date(1644412885 * 1000).toISOString())
})

test('TTS parse: AWAITING_SHIPMENT → order.status_changed ready-to-ship; CANCEL → cancelled', () => {
  const handler = new TiktokWebhookHandler({ appKey: APP_KEY, appSecret: APP_SECRET })

  const shipping = handler.parse(request(RAW_BODY.replace('"order_status":"UNPAID"', '"order_status":"AWAITING_SHIPMENT"')))[0]
  assert.ok(shipping)
  assert.equal(shipping.kind, 'order.status_changed')
  assert.equal(shipping.status, 'ready-to-ship')

  const cancelled = handler.parse(
    request(RAW_BODY.replace('"order_status":"UNPAID"', '"order_status":"CANCEL"')),
  )[0]
  assert.ok(cancelled)
  assert.equal(cancelled.status, 'cancelled')
})

test('TTS parse: type != 1 → [] dan malformed body → exception', () => {
  const handler = new TiktokWebhookHandler({ appKey: APP_KEY, appSecret: APP_SECRET })

  const otherType = request(RAW_BODY.replace('"type":1', '"type":2'))
  assert.deepEqual(handler.parse(otherType), [])
  assert.throws(() => handler.parse(request('not-json')), /JSON/i)
})
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WebhookRequest } from '@opensellpy/core'
import { computeLazadaWebhookSignature, LazadaWebhookHandler } from './order.webhook-mapper.js'

const APP_SECRET = 'lazada-app-secret'
const RAW_BODY = JSON.stringify({
  seller_id: 400606482963,
  message_type: 0,
  data: {
    order_status: 'pending',
    trade_order_id: 1250905272558269,
    trade_order_line_id: 1250905273458269,
    status_update_time: 1694620790,
    buyer_id: 410404458269,
  },
  timestamp: 1694620800,
  site: 'lazada_id',
})

function request(rawBody: string = RAW_BODY): WebhookRequest {
  return {
    rawBody,
    headers: {
      authorization: computeLazadaWebhookSignature(APP_SECRET, rawBody),
      'content-type': 'application/json',
    },
  }
}

test('Lazada verifySignature: valid utk signature benar, invalid utk salah', async () => {
  const handler = new LazadaWebhookHandler({ appSecret: APP_SECRET })

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

test('Lazada parse: pending → order.created; id order = trade_order_line_id', () => {
  const handler = new LazadaWebhookHandler({ appSecret: APP_SECRET })

  const first = handler.parse(request())[0]
  assert.ok(first)
  assert.equal(first.kind, 'order.created')
  assert.equal(first.orderId, '1250905273458269')
  assert.equal(first.platformOrderId, '1250905272558269')
  assert.equal(first.status, 'pending')
  assert.equal(first.occurredAt, new Date(1694620790 * 1000).toISOString())
  assert.equal(first.eventId, '1250905273458269:pending:1694620790')
  assert.equal(handler.parse(request())[0]?.eventId, first.eventId)
})

test('Lazada parse: ready_to_ship → status_changed; shipped → shipped', () => {
  const handler = new LazadaWebhookHandler({ appSecret: APP_SECRET })

  const rts = handler.parse(request(RAW_BODY.replace('"order_status":"pending"', '"order_status":"ready_to_ship"')))[0]
  assert.ok(rts)
  assert.equal(rts.kind, 'order.status_changed')
  assert.equal(rts.status, 'ready-to-ship')

  const shipped = handler.parse(request(RAW_BODY.replace('"order_status":"pending"', '"order_status":"shipped"')))[0]
  assert.ok(shipped)
  assert.equal(shipped.kind, 'order.status_changed')
  assert.equal(shipped.status, 'shipped')
})

test('Lazada parse: message_type != 0 → [] dan malformed body → exception', () => {
  const handler = new LazadaWebhookHandler({ appSecret: APP_SECRET })

  const reverse = request(RAW_BODY.replace('"message_type":0', '"message_type":1'))
  assert.deepEqual(handler.parse(reverse), [])
  assert.throws(() => handler.parse(request('not-json')), /JSON/i)
})
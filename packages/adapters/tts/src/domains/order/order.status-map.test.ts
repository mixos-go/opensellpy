import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromTiktokOrderStatus,
  fromTiktokOrderStatusToItem,
  toTiktokOrderStatus,
} from './order.status-map.js'

test('toTiktokOrderStatus memetakan status domain → order_status TikTok', () => {
  assert.equal(toTiktokOrderStatus('pending'), 'UNPAID')
  assert.equal(toTiktokOrderStatus('ready-to-ship'), 'AWAITING_SHIPMENT')
  assert.equal(toTiktokOrderStatus('shipped'), 'IN_TRANSIT')
  assert.equal(toTiktokOrderStatus('delivered'), 'COMPLETED')
  assert.equal(toTiktokOrderStatus('cancelled'), 'CANCELLED')
  assert.equal(toTiktokOrderStatus('returned'), undefined)
  assert.equal(toTiktokOrderStatus('failed'), undefined)
})

test('fromTiktokOrderStatus memetakan order_status TikTok → status domain', () => {
  assert.equal(fromTiktokOrderStatus('UNPAID'), 'pending')
  assert.equal(fromTiktokOrderStatus('AWAITING_SHIPMENT'), 'ready-to-ship')
  assert.equal(fromTiktokOrderStatus('RTS'), 'ready-to-ship')
  assert.equal(fromTiktokOrderStatus('IN_TRANSIT'), 'shipped')
  assert.equal(fromTiktokOrderStatus('AWAITING_COLLECTION'), 'shipped')
  assert.equal(fromTiktokOrderStatus('COMPLETED'), 'delivered')
  assert.equal(fromTiktokOrderStatus('CANCELLED'), 'cancelled')
  assert.equal(fromTiktokOrderStatus('EXPIRED'), 'cancelled')
  assert.equal(fromTiktokOrderStatus('CHARGED_BACK'), 'cancelled')
  assert.equal(fromTiktokOrderStatus(undefined), 'pending')
})

test('fromTiktokOrderStatusToItem mengikuti status order', () => {
  assert.equal(fromTiktokOrderStatusToItem('AWAITING_SHIPMENT'), 'pending')
  assert.equal(fromTiktokOrderStatusToItem('IN_TRANSIT'), 'shipped')
  assert.equal(fromTiktokOrderStatusToItem('COMPLETED'), 'delivered')
  assert.equal(fromTiktokOrderStatusToItem('CANCELLED'), 'cancelled')
})
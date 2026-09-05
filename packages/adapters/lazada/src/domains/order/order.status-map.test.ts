import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromLazadaOrderStatus,
  fromLazadaOrderStatusToItem,
  pickLazadaOrderStatus,
  toLazadaOrderStatus,
} from './order.status-map.js'

test('toLazadaOrderStatus memetakan status domain → status Lazada', () => {
  assert.equal(toLazadaOrderStatus('pending'), 'unpaid')
  assert.equal(toLazadaOrderStatus('ready-to-ship'), 'ready_to_ship')
  assert.equal(toLazadaOrderStatus('shipped'), 'shipped')
  assert.equal(toLazadaOrderStatus('delivered'), 'delivered')
  assert.equal(toLazadaOrderStatus('cancelled'), 'canceled')
  assert.equal(toLazadaOrderStatus('returned'), 'returned')
  assert.equal(toLazadaOrderStatus('failed'), 'failed')
})

test('fromLazadaOrderStatus memetakan status Lazada → status domain', () => {
  assert.equal(fromLazadaOrderStatus('unpaid'), 'pending')
  assert.equal(fromLazadaOrderStatus('pending'), 'pending')
  assert.equal(fromLazadaOrderStatus('ready_to_ship'), 'ready-to-ship')
  assert.equal(fromLazadaOrderStatus('toship'), 'ready-to-ship')
  assert.equal(fromLazadaOrderStatus('topack'), 'ready-to-ship')
  assert.equal(fromLazadaOrderStatus('shipped'), 'shipped')
  assert.equal(fromLazadaOrderStatus('shipping'), 'shipped')
  assert.equal(fromLazadaOrderStatus('lost'), 'shipped')
  assert.equal(fromLazadaOrderStatus('delivered'), 'delivered')
  assert.equal(fromLazadaOrderStatus('canceled'), 'cancelled')
  assert.equal(fromLazadaOrderStatus('returned'), 'returned')
  assert.equal(fromLazadaOrderStatus('failed'), 'failed')
  assert.equal(fromLazadaOrderStatus(undefined), 'pending')
})

test('pickLazadaOrderStatus memilih status paling representatif', () => {
  assert.equal(pickLazadaOrderStatus(['pending', 'shipped', 'toship']), 'shipped')
  assert.equal(pickLazadaOrderStatus(['unpaid', 'topack']), 'topack')
  assert.equal(pickLazadaOrderStatus(undefined), undefined)
  assert.equal(pickLazadaOrderStatus([]), undefined)
})

test('fromLazadaOrderStatusToItem memetakan status item', () => {
  assert.equal(fromLazadaOrderStatusToItem('shipped'), 'shipped')
  assert.equal(fromLazadaOrderStatusToItem('delivered'), 'delivered')
  assert.equal(fromLazadaOrderStatusToItem('canceled'), 'cancelled')
  assert.equal(fromLazadaOrderStatusToItem(undefined), 'pending')
})
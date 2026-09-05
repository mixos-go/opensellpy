import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromBlibliOrderStatus,
  fromBlibliOrderStatusToItem,
  toBlibliOrderStatuses,
} from '../order/order.status-map.js'

test('toBlibliOrderStatuses memetakan status filter domain', () => {
  assert.deepEqual(toBlibliOrderStatuses('ready-to-ship'), ['FP', 'BP'])
  assert.deepEqual(toBlibliOrderStatuses('shipped'), ['FR'])
  assert.deepEqual(toBlibliOrderStatuses('delivered'), ['D'])
  assert.deepEqual(toBlibliOrderStatuses('cancelled'), ['CX'])
  assert.deepEqual(toBlibliOrderStatuses('returned'), ['RT', 'VB'])
  assert.equal(toBlibliOrderStatuses('pending'), undefined)
  assert.equal(toBlibliOrderStatuses(undefined), undefined)
})

test('fromBlibliOrderStatus memetakan kode status order Blibli', () => {
  assert.equal(fromBlibliOrderStatus('FP'), 'ready-to-ship')
  assert.equal(fromBlibliOrderStatus('BP'), 'ready-to-ship')
  assert.equal(fromBlibliOrderStatus('BOPIS'), 'ready-to-ship')
  assert.equal(fromBlibliOrderStatus('FR'), 'shipped')
  assert.equal(fromBlibliOrderStatus('D'), 'delivered')
  assert.equal(fromBlibliOrderStatus('CX'), 'cancelled')
  assert.equal(fromBlibliOrderStatus('RT'), 'returned')
  assert.equal(fromBlibliOrderStatus('VB'), 'returned')
  assert.equal(fromBlibliOrderStatus('UNKNOWN'), 'pending')
  assert.equal(fromBlibliOrderStatus(undefined), 'pending')
})

test('fromBlibliOrderStatusToItem memetakan kode → OrderItemStatus', () => {
  assert.equal(fromBlibliOrderStatusToItem('FR'), 'shipped')
  assert.equal(fromBlibliOrderStatusToItem('D'), 'delivered')
  assert.equal(fromBlibliOrderStatusToItem('CX'), 'cancelled')
  assert.equal(fromBlibliOrderStatusToItem('RT'), 'returned')
  assert.equal(fromBlibliOrderStatusToItem('FP'), 'pending')
})
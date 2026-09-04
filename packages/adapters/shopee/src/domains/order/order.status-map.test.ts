import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeOrderStatus, toShopeeOrderStatus } from './order.status-map.js'

test('toShopeeOrderStatus memetakan status domain → order_status Shopee', () => {
  assert.equal(toShopeeOrderStatus('pending'), 'UNPAID')
  assert.equal(toShopeeOrderStatus('ready-to-ship'), 'READY_TO_SHIP')
  assert.equal(toShopeeOrderStatus('shipped'), 'SHIPPED')
  assert.equal(toShopeeOrderStatus('delivered'), 'COMPLETED')
  assert.equal(toShopeeOrderStatus('cancelled'), 'CANCELLED')
  assert.equal(toShopeeOrderStatus('returned'), 'RETURNED')
  assert.equal(toShopeeOrderStatus('failed'), undefined)
})

test('fromShopeeOrderStatus memetakan order_status Shopee → status domain', () => {
  assert.equal(fromShopeeOrderStatus('UNPAID'), 'pending')
  assert.equal(fromShopeeOrderStatus('READY_TO_SHIP'), 'ready-to-ship')
  assert.equal(fromShopeeOrderStatus('PROCESSED'), 'ready-to-ship')
  assert.equal(fromShopeeOrderStatus('SHIPPED'), 'shipped')
  assert.equal(fromShopeeOrderStatus('COMPLETED'), 'delivered')
  assert.equal(fromShopeeOrderStatus('IN_CANCEL'), 'cancelled')
  assert.equal(fromShopeeOrderStatus('CANCELLED'), 'cancelled')
  assert.equal(fromShopeeOrderStatus('RETURNED'), 'returned')
  assert.equal(fromShopeeOrderStatus(undefined), 'pending')
})
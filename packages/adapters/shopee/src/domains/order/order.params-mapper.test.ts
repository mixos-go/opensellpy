import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toShopeeListOrdersParams } from '../order/order.params-mapper.js'

test('toShopeeListOrdersParams memetakan status + limit', () => {
  const params = toShopeeListOrdersParams({ page: 2, limit: 25, status: 'shipped' })
  assert.equal(params['page_size'], 25)
  assert.equal(params['order_status'], 'SHIPPED')
  assert.equal(typeof params['time_from'], 'number')
  assert.equal(typeof params['time_to'], 'number')
})

test('toShopeeListOrdersParams tanpa status → order_status tidak dikirim', () => {
  const params = toShopeeListOrdersParams({ page: 1, limit: 10 })
  assert.equal(params['order_status'], undefined)
})

test('toShopeeListOrdersParams status failed → order_status tidak didukung, di-omit', () => {
  const params = toShopeeListOrdersParams({ page: 1, limit: 10, status: 'failed' })
  assert.equal(params['order_status'], undefined)
})

test('toShopeeListOrdersParams override window updatedFrom/updatedTo', () => {
  const params = toShopeeListOrdersParams({ page: 1, limit: 10, updatedFrom: 1700000000, updatedTo: 1700000500 })
  assert.equal(params['time_from'], 1700000000)
  assert.equal(params['time_to'], 1700000500)
})
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toTiktokSearchOrdersParams } from '../order/order.params-mapper.js'

test('toTiktokSearchOrdersParams memetakan status + limit', () => {
  const params = toTiktokSearchOrdersParams({ page: 2, limit: 25, status: 'shipped' })
  assert.equal(params['page_size'], 25)
  assert.equal(params['order_status'], 'IN_TRANSIT')
  assert.equal(typeof params['create_time_ge'], 'number')
  assert.equal(typeof params['create_time_lt'], 'number')
})

test('toTiktokSearchOrdersParams tanpa status → order_status tidak dikirim', () => {
  const params = toTiktokSearchOrdersParams({ page: 1, limit: 10 })
  assert.equal(params['order_status'], undefined)
})

test('toTiktokSearchOrdersParams status failed → order_status tidak didukung, di-omit', () => {
  const params = toTiktokSearchOrdersParams({ page: 1, limit: 10, status: 'failed' })
  assert.equal(params['order_status'], undefined)
})
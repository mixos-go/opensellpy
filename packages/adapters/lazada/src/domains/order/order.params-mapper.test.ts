import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toLazadaListOrdersParams } from '../order/order.params-mapper.js'

test('toLazadaListOrdersParams memetakan status + offset', () => {
  const params = toLazadaListOrdersParams({ page: 2, limit: 25, status: 'shipped' })
  assert.equal(params['offset'], 25)
  assert.equal(params['limit'], 25)
  assert.equal(params['status'], 'shipped')
  assert.equal(params['sort_by'], 'created_at')
  assert.equal(typeof params['created_after'], 'string')
})

test('toLazadaListOrdersParams tanpa status → status tidak dikirim', () => {
  const params = toLazadaListOrdersParams({ page: 1, limit: 10 })
  assert.equal(params['status'], undefined)
})

test('toLazadaListOrdersParams override window updatedFrom/updatedTo', () => {
  const params = toLazadaListOrdersParams({ page: 1, limit: 10, updatedFrom: 1700000000, updatedTo: 1700000500 })
  assert.equal(params['created_after'], new Date(1700000000 * 1000).toISOString())
  assert.equal(params['created_before'], new Date(1700000500 * 1000).toISOString())
})
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toBlibliOrderListBody } from '../order/order.params-mapper.js'

test('toBlibliOrderListBody tanpa status → filter kosong', () => {
  const body = toBlibliOrderListBody({ page: 1, limit: 10 })
  assert.deepEqual(body['filter'], {})
  assert.deepEqual(body['paging'], { page: 0, size: 10 })
  assert.deepEqual(body['sorting'], {
    by: 'statusFPUpdatedTimestamp',
    direction: 'ASC',
  })
})

test('toBlibliOrderListBody dengan status → filter.orderItemStatuses', () => {
  const body = toBlibliOrderListBody({ page: 3, limit: 50, status: 'ready-to-ship' })
  assert.deepEqual(body['filter'], { orderItemStatuses: ['FP', 'BP'] })
  assert.deepEqual(body['paging'], { page: 2, size: 50 })
})

test('toBlibliOrderListBody membatasi size maksimal 50', () => {
  const body = toBlibliOrderListBody({ page: 1, limit: 100 })
  assert.deepEqual(body['paging'], { page: 0, size: 50 })
})
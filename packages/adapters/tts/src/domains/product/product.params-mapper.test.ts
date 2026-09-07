import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toTiktokSearchProductsBody } from '../product/product.params-mapper.js'

test('toTiktokSearchProductsBody default tanpa window waktu', () => {
  const params = toTiktokSearchProductsBody({ page: 1, limit: 10 })
  assert.equal('create_time_ge' in params, false)
  assert.equal('create_time_le' in params, false)
})

test('toTiktokSearchProductsBody updatedFrom/updatedTo → create_time_ge/le', () => {
  const params = toTiktokSearchProductsBody({ page: 1, limit: 10, updatedFrom: 1700000000, updatedTo: 1700000500 })
  assert.equal(params['create_time_ge'], 1700000000)
  assert.equal(params['create_time_le'], 1700000500)
})
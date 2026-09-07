import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toLazadaListProductsParams } from '../product/product.params-mapper.js'

test('toLazadaListProductsParams default tanpa create_after', () => {
  const params = toLazadaListProductsParams({ page: 1, limit: 10 })
  assert.equal('create_after' in params, false)
  assert.equal('create_before' in params, false)
  assert.equal(params['filter'], 'live')
})

test('toLazadaListProductsParams updatedFrom → create_after; updatedTo diabaikan', () => {
  const params = toLazadaListProductsParams({ page: 1, limit: 10, updatedFrom: 1700000000, updatedTo: 1700000500 })
  assert.equal(params['create_after'], new Date(1700000000 * 1000).toISOString())
  assert.equal('create_before' in params, false)
})
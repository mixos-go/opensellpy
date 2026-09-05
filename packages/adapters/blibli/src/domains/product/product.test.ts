import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromBlibliProduct } from '../product/product.mapper.js'
import {
  fromBlibliProductState,
  toBlibliProductStateFilter,
} from '../product/product.status-map.js'
import { toBlibliListProductsBody } from '../product/product.params-mapper.js'

test('fromBlibliProduct memetakan content list → Product sintetis', () => {
  const product = fromBlibliProduct({
    category: { code: 'OB-00009', name: 'Smartphones' },
    images: [{ main: true, path: 'https://cdn/p1.jpg' }],
    product: { name: 'Pocophone', sku: 'TOQ-15126-00411', state: 'ACTIVE' },
    counter: { stock: 150, variant: 10 },
    price: { normal: { min: 15000, max: 25000 } },
  })
  assert.equal(product.id, 'TOQ-15126-00411')
  assert.equal(product.platformProductId, 'TOQ-15126-00411')
  assert.equal(product.name, 'Pocophone')
  assert.equal(product.status, 'active')
  assert.equal(product.categoryId, 'OB-00009')
  assert.deepEqual(product.images, ['https://cdn/p1.jpg'])
  assert.equal(product.variants.length, 1)
  assert.equal(product.variants[0]?.sku, 'TOQ-15126-00411')
  assert.equal(product.variants[0]?.price.amount, 15000)
  assert.equal(product.variants[0]?.price.currency, 'IDR')
})

test('fromBlibliProduct tanpa sku/harga → fallback aman', () => {
  const product = fromBlibliProduct({ product: { state: 'ARCHIVED' } })
  assert.equal(product.status, 'inactive')
  assert.equal(product.variants.length, 0)
  assert.equal(product.categoryId, undefined)
})

test('toBlibliProductStateFilter memetakan status domain → filter.state', () => {
  assert.equal(toBlibliProductStateFilter('active'), 'ACTIVE')
  assert.equal(toBlibliProductStateFilter('inactive'), 'ARCHIVED')
  assert.equal(toBlibliProductStateFilter('draft'), undefined)
  assert.equal(toBlibliProductStateFilter(undefined), undefined)
})

test('fromBlibliProductState memetakan state Blibli', () => {
  assert.equal(fromBlibliProductState('ACTIVE'), 'active')
  assert.equal(fromBlibliProductState('OOS'), 'active')
  assert.equal(fromBlibliProductState('ARCHIVED'), 'inactive')
  assert.equal(fromBlibliProductState('PRE_LIVE'), 'draft')
  assert.equal(fromBlibliProductState('ANEH'), 'inactive')
})

test('toBlibliListProductsBody menyusun body filter/paging/sorting', () => {
  const body = toBlibliListProductsBody({ page: 2, limit: 25, status: 'active' })
  assert.deepEqual(body['filter'], { state: 'ACTIVE' })
  assert.deepEqual(body['paging'], { page: 1, size: 25 })
  assert.deepEqual(body['sorting'], { by: 'createdDate', direction: 'DESC' })
  const bodyNone = toBlibliListProductsBody({ page: 1, limit: 10 })
  assert.deepEqual(bodyNone['filter'], {})
})
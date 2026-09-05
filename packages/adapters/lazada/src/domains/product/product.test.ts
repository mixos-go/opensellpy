import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromLazadaProductStatus, toLazadaProductFilter } from '../product/product.status-map.js'
import { fromLazadaProduct } from '../product/product.mapper.js'
import { toLazadaListProductsParams } from '../product/product.params-mapper.js'

test('status map produk', () => {
  assert.equal(toLazadaProductFilter('active'), 'live')
  assert.equal(toLazadaProductFilter('inactive'), 'inactive')
  assert.equal(toLazadaProductFilter('draft'), 'pending')
  assert.equal(fromLazadaProductStatus('live'), 'active')
  assert.equal(fromLazadaProductStatus('pending'), 'draft')
  assert.equal(fromLazadaProductStatus('rejected'), 'draft')
  assert.equal(fromLazadaProductStatus('inactive'), 'inactive')
  assert.equal(fromLazadaProductStatus('sold-out'), 'inactive')
  assert.equal(fromLazadaProductStatus(undefined), 'inactive')
})

test('fromLazadaProduct memetakan product + skus', () => {
  const product = fromLazadaProduct({
    item_id: 12345,
    status: 'live',
    primary_category: 1001,
    images: JSON.stringify(['https://img.example/a.jpg', 'https://img.example/b.jpg']),
    created_time: '2024-01-01T00:00:00Z',
    updated_time: '2024-02-01T00:00:00Z',
    skus: [
      {
        sku_id: 555,
        seller_sku: 'TAS-HIJAU',
        quantity: 7,
        price: { amount: '250000', currency: 'IDR' },
      },
    ],
  })
  assert.equal(product.id, '12345')
  assert.equal(product.platformProductId, '12345')
  assert.equal(product.status, 'active')
  assert.equal(product.categoryId, '1001')
  assert.deepEqual(product.images, ['https://img.example/a.jpg', 'https://img.example/b.jpg'])
  assert.equal(product.variants.length, 1)
  assert.equal(product.variants[0]?.sku, 'TAS-HIJAU')
  assert.equal(product.variants[0]?.price.amount, 250000)
  assert.equal(product.variants[0]?.price.currency, 'IDR')
})

test('fromLazadaProduct tanpa field opsional → default aman', () => {
  const product = fromLazadaProduct({ item_id: 1, status: 'deleted' })
  assert.equal(product.status, 'inactive')
  assert.equal(product.categoryId, undefined)
  assert.equal(product.images.length, 0)
  assert.equal(product.variants.length, 0)
})

test('toLazadaListProductsParams offset + filter default live', () => {
  const params = toLazadaListProductsParams({ page: 3, limit: 10 })
  assert.equal(params['offset'], '20')
  assert.equal(params['limit'], '10')
  assert.equal(params['filter'], 'live')
  const withStatus = toLazadaListProductsParams({ page: 1, limit: 10, status: 'draft' })
  assert.equal(withStatus['filter'], 'pending')
})
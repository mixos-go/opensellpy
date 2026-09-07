import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromTiktokProductStatus, toTiktokProductStatus } from '../product/product.status-map.js'
import { fromTiktokProduct } from '../product/product.mapper.js'
import { toTiktokSearchProductsBody } from '../product/product.params-mapper.js'

test('status map produk', () => {
  assert.equal(toTiktokProductStatus('active'), 'ACTIVE')
  assert.equal(toTiktokProductStatus('inactive'), 'INACTIVE')
  assert.equal(toTiktokProductStatus('draft'), 'DRAFT')
  assert.equal(fromTiktokProductStatus('ACTIVE'), 'active')
  assert.equal(fromTiktokProductStatus('DRAFT'), 'draft')
  assert.equal(fromTiktokProductStatus('INACTIVE'), 'inactive')
  assert.equal(fromTiktokProductStatus('BANNED'), 'inactive')
  assert.equal(fromTiktokProductStatus(undefined), 'inactive')
})

test('fromTiktokProduct memetakan produk + skus', () => {
  const product = fromTiktokProduct({
    id: 'PP-1',
    title: 'Tas Ransel',
    description: 'Tas ransel hijau',
    product_status: 'ACTIVE',
    category_id: '100123',
    main_images: [{ uri: 'https://img.example/b.jpg', urls: ['https://img.example/a.jpg'] }],
    skus: [
      { id: 'SK-1', seller_sku: 'TAS-HIJAU', quantity: 7, price: { sale_price: '250000', currency: 'IDR' } },
    ],
  })
  assert.equal(product.id, 'PP-1')
  assert.equal(product.platformProductId, 'PP-1')
  assert.equal(product.name, 'Tas Ransel')
  assert.equal(product.description, 'Tas ransel hijau')
  assert.equal(product.status, 'active')
  assert.equal(product.categoryId, '100123')
  assert.deepEqual(product.images, ['https://img.example/a.jpg'])
  assert.equal(product.variants.length, 1)
  assert.equal(product.variants[0]?.sku, 'TAS-HIJAU')
  assert.equal(product.variants[0]?.price.amount, 250000)
  assert.equal(product.variants[0]?.price.currency, 'IDR')
})

test('fromTiktokProduct tanpa field opsional → default aman', () => {
  const product = fromTiktokProduct({ id: 'PP-2', product_status: 'BANNED' })
  assert.equal(product.description, undefined)
  assert.equal(product.categoryId, undefined)
  assert.equal(product.status, 'inactive')
  assert.equal(product.images.length, 0)
  assert.equal(product.variants.length, 0)
})

test('toTiktokSearchProductsBody default tanpa window waktu + status optional', () => {
  const body = toTiktokSearchProductsBody({ page: 1, limit: 10 })
  assert.equal('create_time_ge' in body, false)
  assert.equal('create_time_le' in body, false)
  assert.equal(body['status'], undefined)
  const withStatus = toTiktokSearchProductsBody({ page: 1, limit: 10, status: 'draft' })
  assert.equal(withStatus['status'], 'DRAFT')
})
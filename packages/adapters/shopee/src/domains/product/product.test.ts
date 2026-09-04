import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeItemStatus, toShopeeItemStatus } from '../product/product.status-map.js'
import { fromShopeeItemBaseInfo } from '../product/product.mapper.js'
import { toShopeeListProductsParams } from '../product/product.params-mapper.js'

test('status map produk', () => {
  assert.equal(toShopeeItemStatus('active'), 'NORMAL')
  assert.equal(toShopeeItemStatus('inactive'), 'UNLIST')
  assert.equal(toShopeeItemStatus('draft'), 'REVIEWING')
  assert.equal(fromShopeeItemStatus('NORMAL'), 'active')
  assert.equal(fromShopeeItemStatus('REVIEWING'), 'draft')
  assert.equal(fromShopeeItemStatus('UNLIST'), 'inactive')
  assert.equal(fromShopeeItemStatus('BANNED'), 'inactive')
  assert.equal(fromShopeeItemStatus(undefined), 'inactive')
})

test('fromShopeeItemBaseInfo memetakan item dasar', () => {
  const item = {
    item_id: 12345,
    item_name: 'Tas Ransel',
    description: 'Tas ransel hijau',
    item_sku: 'TAS-HIJAU',
    category_id: 100123,
    item_status: 'NORMAL',
    update_time: 1700000000,
    image: { image_url_list: ['https://img.example/a.jpg'] },
    price_info: [{ currency: 'IDR', original_price: 250000 }],
    stock_info_v2: { summary_info: { total_available_stock: 7 } },
  }
  const product = fromShopeeItemBaseInfo(item)
  assert.equal(product.id, '12345')
  assert.equal(product.platformProductId, '12345')
  assert.equal(product.name, 'Tas Ransel')
  assert.equal(product.description, 'Tas ransel hijau')
  assert.equal(product.status, 'active')
  assert.equal(product.categoryId, '100123')
  assert.deepEqual(product.images, ['https://img.example/a.jpg'])
  assert.equal(product.variants.length, 1)
  assert.equal(product.variants[0]?.price.amount, 250000)
  assert.equal(product.variants[0]?.price.currency, 'IDR')
  assert.equal(product.variants[0]?.id, '12345')
})

test('fromShopeeItemBaseInfo tanpa field opsional → default aman', () => {
  const product = fromShopeeItemBaseInfo({ item_id: 1 })
  assert.equal(product.description, undefined)
  assert.equal(product.categoryId, undefined)
  assert.equal(product.status, 'inactive')
  assert.equal(product.images.length, 0)
  assert.equal(product.variants[0]?.price.amount, 0)
})

test('toShopeeListProductsParams menghitung offset dan default item_status', () => {
  const params = toShopeeListProductsParams({ page: 3, limit: 10 })
  assert.equal(params['offset'], 20)
  assert.equal(params['page_size'], 10)
  assert.equal(params['item_status'], 'NORMAL')
  const withStatus = toShopeeListProductsParams({ page: 1, limit: 10, status: 'draft' })
  assert.equal(withStatus['item_status'], 'REVIEWING')
})
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeStockLevel } from '../inventory/inventory.mapper.js'
import { toShopeeUpdateStockBody } from '../inventory/inventory.params-mapper.js'

test('fromShopeeStockLevel memetakan stok item', () => {
  const level = fromShopeeStockLevel('TAS-HIJAU', {
    item_id: 123,
    item_sku: 'TAS-HIJAU',
    update_time: 1700000000,
    stock_info_v2: {
      summary_info: { total_available_stock: 5 },
      seller_stock: [{ location_id: 'L1', stock: 5 }],
    },
  })
  assert.equal(level.sku, 'TAS-HIJAU')
  assert.equal(level.quantity, 5)
  assert.equal(level.warehouseId, 'L1')
  assert.equal(level.updatedAt, new Date(1700000000 * 1000).toISOString())
})

test('fromShopeeStockLevel default saat stok kosong', () => {
  const level = fromShopeeStockLevel('X', { item_id: 1 })
  assert.equal(level.quantity, 0)
  assert.equal(level.updatedAt, new Date(0).toISOString())
  assert.equal(level.warehouseId, undefined)
})

test('toShopeeUpdateStockBody tanpa warehouseId → seller_stock tanpa location', () => {
  const body = toShopeeUpdateStockBody(999, { sku: 'X', quantity: 3 })
  assert.equal(body['item_id'], 999)
  assert.deepEqual(body['stock_list'], [{ seller_stock: [{ stock: 3 }] }])
})

test('toShopeeUpdateStockBody dengan warehouseId → location di-include', () => {
  const body = toShopeeUpdateStockBody(999, { sku: 'X', quantity: 3, warehouseId: 'L2' })
  assert.deepEqual(body['stock_list'], [{ seller_stock: [{ stock: 3, location_id: 'L2' }] }])
})
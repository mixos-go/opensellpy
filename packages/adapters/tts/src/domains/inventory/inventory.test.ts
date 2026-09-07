import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromTiktokStockLevel } from '../inventory/inventory.mapper.js'
import { toTiktokUpdateInventoryBody } from '../inventory/inventory.params-mapper.js'

test('fromTiktokStockLevel memetakan stok SKU (per-warehouse, live-shape)', () => {
  const level = fromTiktokStockLevel(
    'TAS-HIJAU',
    { update_time: 1700000000 },
    {
      id: 'SK-1',
      seller_sku: 'TAS-HIJAU',
      inventory: [
        { warehouse_id: 'W-SALES', quantity: 1000 },
        { warehouse_id: 'W-RETURN', quantity: 7 },
      ],
    },
  )
  assert.equal(level.sku, 'TAS-HIJAU')
  assert.equal(level.quantity, 1007)
  assert.equal(level.updatedAt, new Date(1700000000 * 1000).toISOString())
})

test('fromTiktokStockLevel fallback ke field quantity legacy', () => {
  const level = fromTiktokStockLevel('X', {}, { id: 'SK-2', quantity: 5 })
  assert.equal(level.quantity, 5)
})

test('fromTiktokStockLevel default saat stok kosong', () => {
  const level = fromTiktokStockLevel('X', {}, { id: 'SK-2' })
  assert.equal(level.quantity, 0)
  assert.equal(level.updatedAt, new Date(0).toISOString())
})

test('toTiktokUpdateInventoryBody membungkus skus id+inventory per-warehouse', () => {
  const body = toTiktokUpdateInventoryBody('SK-9', 'W-SALES', 3)
  assert.deepEqual(body['skus'], [{ id: 'SK-9', inventory: [{ warehouse_id: 'W-SALES', quantity: 3 }] }])
})
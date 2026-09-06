import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCategory,
  buildCategoryAttribute,
  buildCategoryAttributeList,
  buildCategoryTree,
  buildOrder,
  buildOrderItem,
  buildOrderList,
  buildProduct,
  buildProductList,
  buildShipment,
  buildStockLevel,
  buildTrackingEvent,
  buildWarehouse,
} from './fixtures/index.js'

test('buildOrder menghasilkan shape default deterministik', () => {
  const order = buildOrder()
  assert.equal(order.id, 'ORD-1')
  assert.equal(order.status, 'pending')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.sku, 'SKU-1')
  assert.deepEqual(order.total, { amount: 100000, currency: 'IDR' })
})

test('buildOrder menghasilkan instance baru tiap panggilan (tanpa shared mutation)', () => {
  const first = buildOrder()
  first.items.push(first.items[0] ?? buildOrder().items[0] ?? { id: 'x', sku: 'x', name: 'x', quantity: 0, unitPrice: { amount: 0, currency: 'IDR' }, status: 'pending' })
  const second = buildOrder()
  assert.equal(second.items.length, 1)
  assert.notEqual(first, second)
})

test('buildOrder menerapkan override termasuk nested items', () => {
  const order = buildOrder({
    status: 'shipped',
    items: [buildOrderItem({ id: 'A', sku: 'SKU-A', name: 'A', quantity: 3 })],
  })
  assert.equal(order.status, 'shipped')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.quantity, 3)
})

test('buildOrderList menghasilkan id unik berurutan dan createdAt terstagger', () => {
  const orders = buildOrderList(5, { status: 'delivered' })
  assert.deepEqual(orders.map((o) => o.id), ['ORD-1', 'ORD-2', 'ORD-3', 'ORD-4', 'ORD-5'])
  assert.equal(orders.at(-1)?.createdAt, '2024-01-05T08:00:00.000Z')
  assert.ok(orders.every((o) => o.status === 'delivered'))
})

test('buildProduct default dan override variants', () => {
  const product = buildProduct()
  assert.equal(product.id, 'PRD-1')
  assert.equal(product.status, 'active')
  assert.equal(product.variants[0]?.attributes['color'], 'Hitam')
  const customized = buildProduct({ status: 'draft', name: 'Produk Baru' })
  assert.equal(customized.status, 'draft')
  assert.equal(customized.name, 'Produk Baru')
})

test('buildProductList menghasilkan id unik', () => {
  const products = buildProductList(3)
  assert.deepEqual(products.map((p) => p.id), ['PRD-1', 'PRD-2', 'PRD-3'])
})

test('buildCategoryTree membentuk root dan anak', () => {
  const tree = buildCategoryTree()
  assert.equal(tree.length, 2)
  assert.equal(tree[0]?.name, 'Fashion')
  assert.equal(tree[0]?.children.length, 2)
  assert.equal(tree[0]?.children[1]?.name, 'Celana')
})

test('buildCategory menetapkan override children', () => {
  const leaf = buildCategory({ id: 'LEAF', name: 'Leaf' })
  const root = buildCategory({ id: 'ROOT', name: 'Root', children: [leaf] })
  assert.equal(root.children[0]?.id, 'LEAF')
})

test('buildCategoryAttributeList menghasilkan flag required bergantian', () => {
  const attributes = buildCategoryAttributeList(4)
  assert.equal(attributes.length, 4)
  assert.equal(attributes[0]?.required, false)
  assert.equal(attributes[1]?.required, true)
})

test('buildStockLevel dan buildWarehouse default', () => {
  const stock = buildStockLevel()
  assert.equal(stock.sku, 'SKU-1')
  assert.equal(stock.quantity, 100)
  const warehouse = buildWarehouse()
  assert.equal(warehouse.id, 'WH-1')
  assert.equal(warehouse.name, 'Gudang Utama')
})

test('buildShipment default mengisi event dan items', () => {
  const shipment = buildShipment()
  assert.equal(shipment.id, 'SHIP-1')
  assert.equal(shipment.status, 'created')
  assert.equal(shipment.events[0]?.status, 'created')
  assert.equal(shipment.items[0]?.sku, 'SKU-1')
  const event = buildTrackingEvent({ status: 'in-transit', description: 'Dalam perjalanan' })
  assert.equal(event.status, 'in-transit')
  const attr = buildCategoryAttribute({ required: true })
  assert.equal(attr.required, true)
  const oi = buildOrder().items[0]
  assert.ok(oi !== undefined)
  assert.equal(oi.unitPrice.currency, 'IDR')
})
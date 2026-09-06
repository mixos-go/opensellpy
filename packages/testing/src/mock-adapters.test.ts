import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundError, ValidationError } from '@opensellpy/core'
import {
  MockBackend,
  buildMockSeed,
  createMockBlibliAdapter,
  createMockLazadaAdapter,
  createMockShopeeAdapter,
  createMockTtsAdapter,
  buildOrder,
  buildOrderItem,
  buildProductVariant,
} from './index.js'

test('semua mock adapter mengekspos platform, capabilities, dan seluruh provider', () => {
  const adapters = [
    createMockShopeeAdapter(),
    createMockTtsAdapter(),
    createMockLazadaAdapter(),
    createMockBlibliAdapter(),
  ]
  assert.deepEqual(
    adapters.map((a) => a.platform),
    ['shopee', 'tts', 'lazada', 'blibli'],
  )
  for (const adapter of adapters) {
    assert.deepEqual([...adapter.capabilities].sort(), [
      'category',
      'inventory',
      'logistics',
      'order',
      'product',
    ])
    assert.ok(adapter.order, 'order provider ada')
    assert.ok(adapter.product, 'product provider ada')
    assert.ok(adapter.category, 'category provider ada')
    assert.ok(adapter.inventory, 'inventory provider ada')
    assert.ok(adapter.logistics, 'logistics provider ada')
    assert.ok(adapter.extra instanceof MockBackend)
  }
})

test('mock adapter ber-prefix unik per platform sehingga tidak saling menimpa', async () => {
  const adapters = [createMockShopeeAdapter(), createMockTtsAdapter(), createMockLazadaAdapter(), createMockBlibliAdapter()]
  for (const adapter of adapters) {
    const orders = await adapter.order.listOrders({ page: 1, limit: 10 })
    assert.ok(orders.total > 0)
    assert.ok(orders.items[0]?.id.startsWith(adapter.extra.prefix))
  }
})

test('order.list/get egaliter terhadap override seed dan isolasi per instance', async () => {
  const extraOrder = buildOrder({
    id: 'SHP-ORD-99',
    platformOrderId: 'SHP-PLAT-99',
    items: [buildOrderItem({ id: 'SHP-OI-99', sku: 'SHP-SKU-99' })],
  })
  const adapter = createMockShopeeAdapter({ orders: [extraOrder] })
  const listed = await adapter.order.listOrders({ page: 1, limit: 10 })
  assert.equal(listed.total, 1)
  assert.equal(listed.items[0]?.id, 'SHP-ORD-99')

  const other = createMockShopeeAdapter()
  const otherList = await other.order.listOrders({ page: 1, limit: 100 })
  assert.equal(otherList.total, 5)
  assert.ok(!otherList.items.some((o) => o.id === 'SHP-ORD-99'))
})

test('order.updateOrderStatus mengubah status, item status, dan membuat shipment saat shipped', async () => {
  const adapter = createMockLazadaAdapter()
  const updated = await adapter.order.updateOrderStatus('LZD-ORD-1', 'shipped')
  assert.equal(updated.status, 'shipped')
  assert.equal(updated.items[0]?.status, 'shipped')
  const shipment = adapter.extra.shipments.find((s) => s.orderId === 'LZD-ORD-1')
  assert.ok(shipment, 'shipment otomatis dibuat saat shipped')
  assert.equal(shipment?.items[0]?.sku, updated.items[0]?.sku)
})

test('order.getOrder melempar NotFoundError untuk id tak dikenal', async () => {
  const adapter = createMockTtsAdapter()
  await assert.rejects(() => adapter.order.getOrder('TTS-ORD-XYZ'), NotFoundError)
})

test('product CRUD + status update', async () => {
  const adapter = createMockBlibliAdapter()
  const created = await adapter.product.createProduct({
    name: 'Produk Baru',
    description: 'deskripsi',
    images: ['https://cdn/x.jpg'],
    variants: [buildProductVariant({ sku: 'BLB-NEW-1', price: { amount: 5000, currency: 'IDR' } })],
    categoryId: 'BLB-CAT-5',
  })
  assert.equal(created.id.startsWith('BLB-PRD-'), true)
  assert.equal(created.status, 'active')

  const updated = await adapter.product.updateProduct(created.id, { status: 'draft', name: 'Produk Baru V2' })
  assert.equal(updated.status, 'draft')
  assert.equal(updated.name, 'Produk Baru V2')

  const listed = await adapter.product.listProducts({ page: 1, limit: 100, status: 'draft' })
  assert.ok(listed.items.some((p) => p.id === created.id))
})

test('product explic rejects status invalid diakui ValidationError', async () => {
  const adapter = createMockShopeeAdapter()
  await assert.rejects(
    () => adapter.product.updateProduct('SHP-PRD-1', { status: 'bogus' as never }),
    ValidationError,
  )
})

test('category tree & attributes (+ NotFoundError untuk kategori tak dikenal)', async () => {
  const adapter = createMockShopeeAdapter()
  const tree = await adapter.category.getCategoryTree()
  assert.equal(tree.length, 2)
  assert.equal(tree[0]?.children.length, 2)

  const attributes = await adapter.category.getCategoryAttributes('SHP-CAT-2')
  assert.equal(attributes.length, 2)
  assert.equal(attributes[0]?.required, true)

  await assert.rejects(() => adapter.category.getCategoryAttributes('SHP-CAT-NOPE'), NotFoundError)
})

test('inventory: warehouses, getStock, updateStock', async () => {
  const adapter = createMockBlibliAdapter()
  const warehouses = await adapter.inventory.listWarehouses()
  assert.ok(warehouses.length >= 2)

  const stock = await adapter.inventory.getStock('BLB-SKU-1')
  assert.equal(stock.quantity, 100)

  const updated = await adapter.inventory.updateStock({ sku: 'BLB-SKU-1', quantity: 7, warehouseId: 'BLB-WH-1' })
  assert.equal(updated.quantity, 7)
  assert.equal(updated.warehouseId, 'BLB-WH-1')

  const refreshed = await adapter.inventory.getStock('BLB-SKU-1')
  assert.equal(refreshed.quantity, 7)

  await assert.rejects(() => adapter.inventory.getStock('BLB-SKU-NOPE'), NotFoundError)
})

test('logistics: createShipment, getTracking, cancelShipment', async () => {
  const adapter = createMockTtsAdapter()
  const shipment = await adapter.logistics.createShipment({ orderId: 'TTS-ORD-2' })
  assert.equal(shipment.orderId, 'TTS-ORD-2')
  assert.equal(shipment.status, 'created')
  assert.equal(shipment.carrier, 'Mock Express TTS')

  const tracked = await adapter.logistics.getTracking(shipment.id)
  assert.equal(tracked.id, shipment.id)
  assert.ok(tracked.trackingNumber)

  await adapter.logistics.cancelShipment(shipment.id)
  const cancelled = await adapter.logistics.getTracking(shipment.id)
  assert.equal(cancelled.status, 'cancelled')

  await assert.rejects(() => adapter.logistics.getTracking('TTS-SHIP-NOPE'), NotFoundError)
})

test('buildMockSeed dapat di-inject langsung ke MockBackend untuk seed kustom', async () => {
  const seed = buildMockSeed('shopee', { carrier: 'Kurir Kustom' })
  const backend = new MockBackend(seed)
  assert.equal(backend.carrier, 'Kurir Kustom')
  assert.equal(backend.orders.length, 5)
})
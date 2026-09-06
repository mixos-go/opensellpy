import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OmniClient } from '@mixos-go/opensellpy-client'
import { createMockBlibliAdapter, createMockShopeeAdapter } from './index.js'

test('multi-platform: register dua mock adapter, telusuri urutan order yang diberi tugas', async () => {
  const shopee = createMockShopeeAdapter()
  const blibli = createMockBlibliAdapter()
  const client = new OmniClient()
  client.register(shopee)
  client.register(blibli)

  const shopeeOrders = await client.platform('shopee').order.listOrders({ page: 1, limit: 50 })
  const blibliOrders = await client.platform('blibli').order.listOrders({ page: 1, limit: 50 })

  assert.ok(shopeeOrders.items.every((o) => o.id.startsWith('SHP-')))
  assert.ok(blibliOrders.items.every((o) => o.id.startsWith('BLB-')))
  assert.equal(blibliOrders.total, 5)
  assert.equal(shopeeOrders.total, 5)
  assert.ok(shopeeOrders.items[0]?.id !== blibliOrders.items[0]?.id)
})

test('OmniClient.register + platform() kembali dengan mock adapter yang sama', () => {
  const adapter = createMockShopeeAdapter()
  const client = new OmniClient()
  client.register(adapter)
  assert.equal(client.platform('shopee'), adapter)
})
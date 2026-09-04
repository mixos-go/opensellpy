import { test } from 'node:test'
import assert from 'node:assert/strict'
import type {
  DomainKey,
  ICategoryProvider,
  IInventoryProvider,
  ILogisticsProvider,
  IOrderProvider,
  IProductProvider,
  PlatformAdapter,
  PlatformKey,
} from '@opensellpy/core'
import { getCapabilities, supports } from './capability.js'
import { OmniClient } from './omni-client.js'
import { PlatformNotRegisteredError } from './platform-not-registered.error.js'

const reject = <T>(..._args: unknown[]): Promise<T> =>
  Promise.reject(new Error('stub method, jangan dipanggil di test ini'))

function createStubAdapter(platform: PlatformKey, capabilities: readonly DomainKey[]): PlatformAdapter {
  const order: IOrderProvider = {
    listOrders: reject,
    getOrder: reject,
    updateOrderStatus: reject,
  }
  const product: IProductProvider = {
    listProducts: reject,
    getProduct: reject,
    createProduct: reject,
    updateProduct: reject,
  }
  const category: ICategoryProvider = {
    getCategoryTree: reject,
    getCategoryAttributes: reject,
  }
  const inventory: IInventoryProvider = {
    listWarehouses: reject,
    getStock: reject,
    updateStock: reject,
  }
  const logistics: ILogisticsProvider = {
    createShipment: reject,
    getTracking: reject,
    cancelShipment: reject,
  }
  return { platform, capabilities, order, product, category, inventory, logistics }
}

test('register lalu platform() mengembalikan adapter yang sama', () => {
  const client = new OmniClient()
  const adapter = createStubAdapter('shopee', ['order', 'product'])

  client.register(adapter)

  assert.equal(client.platform('shopee'), adapter)
})

test('platform() melempar PlatformNotRegisteredError untuk key yang belum di-register', () => {
  const client = new OmniClient()

  assert.throws(() => client.platform('tts'), PlatformNotRegisteredError)
})

test('register ulang menimpa adapter untuk platform yang sama', () => {
  const client = new OmniClient()
  const first = createStubAdapter('shopee', ['order'])
  const second = createStubAdapter('shopee', ['order', 'product'])

  client.register(first)
  client.register(second)

  assert.equal(client.platform('shopee'), second)
})

test('getCapabilities mengembalikan capabilities adapter', () => {
  const adapter = createStubAdapter('lazada', ['order', 'inventory'])

  assert.deepEqual(getCapabilities(adapter), ['order', 'inventory'])
})

test('supports true hanya untuk domain di capabilities', () => {
  const adapter = createStubAdapter('blibli', ['order'])

  assert.equal(supports(adapter, 'order'), true)
  assert.equal(supports(adapter, 'logistics'), false)
})
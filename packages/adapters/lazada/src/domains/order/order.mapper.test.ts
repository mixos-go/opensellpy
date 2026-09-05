import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromLazadaOrder } from '../order/order.mapper.js'

test('fromLazadaOrder memetakan raw order Lazada lengkap', () => {
  const order = fromLazadaOrder(
    {
      order_id: 171234567890,
      order_number: 171234567890,
      statuses: ['pending', 'shipped'],
      created_at: '2024-01-01T12:00:00+08:00',
      updated_at: '2024-01-02T12:00:00+08:00',
      price: '150000',
      address_shipping: {
        first_name: 'Budi',
        last_name: 'Santoso',
        phone: '081234567890',
        address1: 'Jl. Merdeka No. 1',
        city: 'Jakarta',
        post_code: '10110',
        country: 'ID',
      },
    },
    [
      {
        order_item_id: 111,
        name: 'Kaos Merah',
        sku: 'SKU-1-RED',
        quantity: 2,
        item_price: '50000',
        currency: 'IDR',
        status: 'shipped',
      },
    ],
    'IDR',
  )
  assert.equal(order.id, '171234567890')
  assert.equal(order.platformOrderId, '171234567890')
  assert.equal(order.status, 'shipped')
  assert.equal(order.total?.amount, 150000)
  assert.equal(order.total?.currency, 'IDR')
  assert.equal(order.shippingAddress?.name, 'Budi Santoso')
  assert.equal(order.shippingAddress?.line1, 'Jl. Merdeka No. 1')
  assert.equal(order.shippingAddress?.city, 'Jakarta')
  assert.equal(order.shippingAddress?.postalCode, '10110')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.sku, 'SKU-1-RED')
  assert.equal(order.items[0]?.quantity, 2)
  assert.equal(order.items[0]?.status, 'shipped')
})

test('fromLazadaOrder tanpa item/address/price → field opsional di-omit', () => {
  const order = fromLazadaOrder({ order_id: 1 })
  assert.equal(order.id, '1')
  assert.equal(order.status, 'pending')
  assert.equal(order.items.length, 0)
  assert.equal(order.shippingAddress, undefined)
  assert.equal(order.total, undefined)
})
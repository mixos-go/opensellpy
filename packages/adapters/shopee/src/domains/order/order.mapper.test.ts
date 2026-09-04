import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeOrder } from '../order/order.mapper.js'

test('fromShopeeOrder memetakan raw order Shopee lengkap', () => {
  const raw = {
    order_sn: '230101AABBCC',
    order_status: 'COMPLETED',
    currency: 'IDR',
    total_amount: 150000,
    create_time: 1700000000,
    update_time: 1700000100,
    item_list: [
      {
        order_item_id: 111,
        item_id: 222,
        model_id: 333,
        item_sku: 'SKU-1',
        model_sku: 'SKU-1-RED',
        item_name: 'Kaos',
        model_name: 'Kaos Merah',
        model_quantity_purchased: 2,
        model_discounted_price: 50000,
        model_original_price: 60000,
      },
    ],
    recipient_address: {
      name: 'Budi',
      phone: '081234567890',
      city: 'Jakarta',
      state: 'DKI Jakarta',
      region: 'Indonesia',
      full_address: 'Jl. Merdeka No. 1',
      zipcode: '10110',
    },
  }
  const order = fromShopeeOrder(raw)
  assert.equal(order.id, '230101AABBCC')
  assert.equal(order.platformOrderId, '230101AABBCC')
  assert.equal(order.status, 'delivered')
  assert.equal(order.total?.amount, 150000)
  assert.equal(order.total?.currency, 'IDR')
  assert.equal(order.createdAt, new Date(1700000000 * 1000).toISOString())
  assert.equal(order.shippingAddress?.line1, 'Jl. Merdeka No. 1')
  assert.equal(order.shippingAddress?.name, 'Budi')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.sku, 'SKU-1-RED')
  assert.equal(order.items[0]?.quantity, 2)
  assert.equal(order.items[0]?.status, 'delivered')
})

test('fromShopeeOrder tanpa item/address/total → field opsional di-omit', () => {
  const order = fromShopeeOrder({ order_sn: 'X', create_time: 0, update_time: 0 })
  assert.equal(order.id, 'X')
  assert.equal(order.items.length, 0)
  assert.equal(order.shippingAddress, undefined)
  assert.equal(order.total, undefined)
})
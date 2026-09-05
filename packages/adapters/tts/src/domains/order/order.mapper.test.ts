import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromTiktokOrder } from '../order/order.mapper.js'

test('fromTiktokOrder memetakan raw order TikTok lengkap', () => {
  const raw = {
    id: '171234567890',
    order_status: 'COMPLETED',
    create_time: 1700000000,
    update_time: 1700000100,
    payment: { currency: 'IDR', total_amount: '150000' },
    recipient_address: {
      name: 'Budi',
      phone_number: '081234567890',
      full_address: 'Jl. Merdeka No. 1',
      post_town: 'Jakarta',
      postal_code: '10110',
      region_code: 'ID',
    },
    line_items: [
      {
        id: 'LI-1',
        seller_sku: 'SKU-1-RED',
        product_name: 'Kaos Merah',
        quantity: 2,
        sale_price: { amount: '50000', currency: 'IDR' },
      },
    ],
  }
  const order = fromTiktokOrder(raw)
  assert.equal(order.id, '171234567890')
  assert.equal(order.platformOrderId, '171234567890')
  assert.equal(order.status, 'delivered')
  assert.equal(order.total?.amount, 150000)
  assert.equal(order.total?.currency, 'IDR')
  assert.equal(order.createdAt, new Date(1700000000 * 1000).toISOString())
  assert.equal(order.shippingAddress?.line1, 'Jl. Merdeka No. 1')
  assert.equal(order.shippingAddress?.name, 'Budi')
  assert.equal(order.shippingAddress?.country, 'ID')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.sku, 'SKU-1-RED')
  assert.equal(order.items[0]?.quantity, 2)
  assert.equal(order.items[0]?.status, 'delivered')
})

test('fromTiktokOrder tanpa item/address/total → field opsional di-omit', () => {
  const order = fromTiktokOrder({ id: 'X', create_time: 0, update_time: 0 })
  assert.equal(order.id, 'X')
  assert.equal(order.items.length, 0)
  assert.equal(order.shippingAddress, undefined)
  assert.equal(order.total, undefined)
})
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromBlibliOrderDetail,
  fromBlibliOrderListItem,
  fromBlibliPackageList,
} from '../order/order.mapper.js'

test('fromBlibliOrderListItem memetakan baris order list lengkap', () => {
  const order = fromBlibliOrderListItem({
    createdDate: 1576758122074,
    order: {
      itemId: '25000134053',
      id: '25000111743',
      quantity: 2,
      itemStatus: 'FR',
      statusFPUpdatedTimestamp: 1545188443310,
    },
    product: { sellerSku: 'SKU-10203', itemName: 'Pocophone', price: 100000 },
  })
  assert.equal(order.id, '25000134053')
  assert.equal(order.platformOrderId, '25000111743')
  assert.equal(order.status, 'shipped')
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0]?.sku, 'SKU-10203')
  assert.equal(order.items[0]?.quantity, 2)
  assert.equal(order.items[0]?.status, 'shipped')
  assert.equal(order.total?.amount, 200000)
  assert.equal(order.total?.currency, 'IDR')
  assert.equal(order.createdAt, new Date(1576758122074).toISOString())
})

test('fromBlibliOrderListItem tanpa data → nilai default', () => {
  const order = fromBlibliOrderListItem({})
  assert.equal(order.id, '')
  assert.equal(order.status, 'pending')
  assert.equal(order.items[0]?.status, 'pending')
  assert.equal(order.updatedAt, new Date(0).toISOString())
})

test('fromBlibliPackageList memetakan semua order item dalam paket', () => {
  const orders = fromBlibliPackageList([
    {
      packageId: 1,
      orderItems: [
        { order: { itemId: '100', id: '1', itemStatus: 'FP' }, product: { sellerSku: 'A' } },
        { order: { itemId: '101', id: '1', itemStatus: 'D' }, product: { sellerSku: 'B' } },
      ],
    },
    { packageId: 2, orderItems: [{ order: { itemId: '102', id: '2', itemStatus: 'CX' } }] },
  ])
  assert.equal(orders.length, 3)
  assert.equal(orders[1]?.status, 'delivered')
  assert.equal(orders[2]?.status, 'cancelled')
})

test('fromBlibliOrderDetail memetakan detail order + alamat', () => {
  const order = fromBlibliOrderDetail({
    id: '25000111743',
    itemId: '25000134053',
    packageId: 777,
    status: 'FP',
    quantity: 1,
    timestamp: { statusUpdatedToFP: 1545188443310 },
    amount: { item: 100000, itemTotal: 100000 },
    recipient: {
      name: 'Budi',
      phoneNumber: '081234567890',
      streetAddress: 'Jl. Merdeka 1',
      city: 'Jakarta',
      state: 'DKI Jakarta',
      zipCode: '10110',
      country: 'ID',
    },
    product: { sellerSku: 'SKU-10203', name: 'Pocophone' },
  })
  assert.equal(order.id, '25000134053')
  assert.equal(order.platformOrderId, '25000111743')
  assert.equal(order.status, 'ready-to-ship')
  assert.equal(order.shippingAddress?.name, 'Budi')
  assert.equal(order.shippingAddress?.city, 'Jakarta')
  assert.equal(order.shippingAddress?.postalCode, '10110')
  assert.equal(order.total?.amount, 100000)
  assert.equal(order.items[0]?.sku, 'SKU-10203')
})

test('fromBlibliOrderDetail tanpa recipient → shippingAddress di-omit', () => {
  const order = fromBlibliOrderDetail({ itemId: '1' })
  assert.equal(order.shippingAddress, undefined)
})
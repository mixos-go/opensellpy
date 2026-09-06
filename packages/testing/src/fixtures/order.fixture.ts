import type { Order, OrderAddress, OrderItem } from '@opensellpy/core'

export function buildOrderAddress(overrides?: Partial<OrderAddress>): OrderAddress {
  const base: OrderAddress = {
    name: 'Budi Santoso',
    phone: '+6281200000000',
    line1: 'Jl. Merdeka No. 1',
    city: 'Jakarta',
    state: 'DKI Jakarta',
    postalCode: '10110',
    country: 'ID',
  }
  return { ...base, ...overrides } as OrderAddress
}

export function buildOrderItem(overrides?: Partial<OrderItem>): OrderItem {
  const base: OrderItem = {
    id: 'OI-1',
    sku: 'SKU-1',
    name: 'Produk Contoh',
    quantity: 1,
    unitPrice: { amount: 100000, currency: 'IDR' },
    status: 'pending',
  }
  return { ...base, ...overrides } as OrderItem
}

export function buildOrder(overrides?: Partial<Order>): Order {
  const base: Order = {
    id: 'ORD-1',
    platformOrderId: 'PLAT-ORD-1',
    status: 'pending',
    items: [buildOrderItem()],
    shippingAddress: buildOrderAddress(),
    total: { amount: 100000, currency: 'IDR' },
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as Order
}

export function buildOrderList(count: number, overrides?: Partial<Order>): Order[] {
  const orders: Order[] = []
  for (let i = 1; i <= count; i += 1) {
    const day = String(i).padStart(2, '0')
    orders.push(
      buildOrder({
        id: `ORD-${i}`,
        platformOrderId: `PLAT-ORD-${i}`,
        createdAt: `2024-01-${day}T08:00:00.000Z`,
        updatedAt: `2024-01-${day}T08:00:00.000Z`,
        items: [buildOrderItem({ id: `OI-${i}`, sku: `SKU-${i}` })],
        ...overrides,
      }),
    )
  }
  return orders
}
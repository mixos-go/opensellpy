import type {
  Category,
  CategoryAttribute,
  Order,
  PlatformKey,
  Product,
  Shipment,
  StockLevel,
  Warehouse,
} from '@mixos-go/opensellpy-core'
import {
  buildCategory,
  buildCategoryAttribute,
  buildOrder,
  buildOrderItem,
  buildProduct,
  buildProductVariant,
  buildShipment,
  buildShipmentItem,
  buildStockLevel,
  buildTrackingEvent,
  buildWarehouse,
} from '../../fixtures/index.js'

export interface MockSeed {
  platform: PlatformKey
  prefix: string
  carrier: string
  orders: Order[]
  products: Product[]
  categories: Category[]
  attributes: Record<string, CategoryAttribute[]>
  warehouses: Warehouse[]
  shipments: Shipment[]
  stock: StockLevel[]
}

const PREFIX: Record<PlatformKey, string> = {
  shopee: 'SHP',
  tts: 'TTS',
  lazada: 'LZD',
  blibli: 'BLB',
}

const TIMESTAMP = '2024-06-01T00:00:00.000Z'

function buildDefaultSeed(platform: PlatformKey): MockSeed {
  const prefix = PREFIX[platform]
  const oi = (i: number, sku: string, name: string, unitPrice: number) =>
    buildOrderItem({
      id: `${prefix}-OI-${i}`,
      sku: `${prefix}-${sku}`,
      name,
      quantity: 1 + (i % 2),
      unitPrice: { amount: unitPrice, currency: 'IDR' },
      status: 'pending',
    })
  const cat = (i: number, name: string, children?: Category[]) =>
    buildCategory({
      id: `${prefix}-CAT-${i}`,
      platformCategoryId: `${prefix}-PCAT-${i}`,
      name,
      ...(children === undefined ? {} : { children }),
    })

  const categories: Category[] = [
    cat(1, 'Fashion', [cat(2, 'Kaos'), cat(3, 'Celana')]),
    cat(4, 'Elektronik', [cat(5, 'Smartphone')]),
  ]

  const attributes: Record<string, CategoryAttribute[]> = {
    [`${prefix}-CAT-2`]: [
      buildCategoryAttribute({ id: `${prefix}-ATTR-1`, name: 'Warna', required: true }),
      buildCategoryAttribute({ id: `${prefix}-ATTR-2`, name: 'Ukuran', required: false }),
    ],
    [`${prefix}-CAT-5`]: [
      buildCategoryAttribute({ id: `${prefix}-ATTR-3`, name: 'RAM', required: true }),
    ],
  }

  const products: Product[] = [
    buildProduct({
      id: `${prefix}-PRD-1`,
      platformProductId: `${prefix}-PPRD-1`,
      name: 'Kaos Polos',
      status: 'active',
      categoryId: `${prefix}-CAT-2`,
      variants: [
        buildProductVariant({
          id: `${prefix}-VAR-1`,
          sku: `${prefix}-SKU-1`,
          name: 'Kaos Polos Hitam L',
          price: { amount: 79000, currency: 'IDR' },
          attributes: { color: 'Hitam', size: 'L' },
        }),
      ],
    }),
    buildProduct({
      id: `${prefix}-PRD-2`,
      platformProductId: `${prefix}-PPRD-2`,
      name: 'Celana Chino',
      status: 'inactive',
      categoryId: `${prefix}-CAT-3`,
      variants: [
        buildProductVariant({
          id: `${prefix}-VAR-2`,
          sku: `${prefix}-SKU-2`,
          name: 'Celana Chino Navy',
          price: { amount: 149000, currency: 'IDR' },
          attributes: { color: 'Navy', size: '32' },
        }),
      ],
    }),
    buildProduct({
      id: `${prefix}-PRD-3`,
      platformProductId: `${prefix}-PPRD-3`,
      name: 'Smartphone X',
      status: 'draft',
      categoryId: `${prefix}-CAT-5`,
      variants: [
        buildProductVariant({
          id: `${prefix}-VAR-3`,
          sku: `${prefix}-SKU-3`,
          name: 'Smartphone X 8/128',
          price: { amount: 2999000, currency: 'IDR' },
          attributes: { ram: '8GB', storage: '128GB' },
        }),
      ],
    }),
  ]

  const orders: Order[] = [
    buildOrder({
      id: `${prefix}-ORD-1`,
      platformOrderId: `${prefix}-PLAT-1`,
      status: 'pending',
      createdAt: '2024-06-01T08:00:00.000Z',
      updatedAt: '2024-06-01T08:00:00.000Z',
      items: [oi(1, 'SKU-1', 'Kaos Polos Hitam L', 79000)],
      total: { amount: 158000, currency: 'IDR' },
    }),
    buildOrder({
      id: `${prefix}-ORD-2`,
      platformOrderId: `${prefix}-PLAT-2`,
      status: 'ready-to-ship',
      createdAt: '2024-06-02T08:00:00.000Z',
      updatedAt: '2024-06-02T09:00:00.000Z',
      items: [oi(2, 'SKU-2', 'Celana Chino Navy', 149000)],
      total: { amount: 149000, currency: 'IDR' },
    }),
    buildOrder({
      id: `${prefix}-ORD-3`,
      platformOrderId: `${prefix}-PLAT-3`,
      status: 'shipped',
      createdAt: '2024-06-03T08:00:00.000Z',
      updatedAt: '2024-06-03T10:00:00.000Z',
      items: [oi(3, 'SKU-2', 'Celana Chino Navy', 149000)],
      total: { amount: 298000, currency: 'IDR' },
    }),
    buildOrder({
      id: `${prefix}-ORD-4`,
      platformOrderId: `${prefix}-PLAT-4`,
      status: 'delivered',
      createdAt: '2024-06-04T08:00:00.000Z',
      updatedAt: '2024-06-05T08:00:00.000Z',
      items: [oi(4, 'SKU-1', 'Kaos Polos Hitam L', 79000)],
      total: { amount: 79000, currency: 'IDR' },
    }),
    buildOrder({
      id: `${prefix}-ORD-5`,
      platformOrderId: `${prefix}-PLAT-5`,
      status: 'cancelled',
      createdAt: '2024-06-05T08:00:00.000Z',
      updatedAt: '2024-06-05T09:00:00.000Z',
      items: [oi(5, 'SKU-3', 'Smartphone X 8/128', 2999000)],
      total: { amount: 2999000, currency: 'IDR' },
    }),
  ]

  const warehouses: Warehouse[] = [
    buildWarehouse({
      id: `${prefix}-WH-1`,
      name: 'Gudang Jakarta',
      address: 'Jl. Industri No. 2, Jakarta',
    }),
    buildWarehouse({
      id: `${prefix}-WH-2`,
      name: 'Gudang Surabaya',
      address: 'Jl. Pelabuhan No. 5, Surabaya',
    }),
  ]

  const stock: StockLevel[] = [
    buildStockLevel({
      sku: `${prefix}-SKU-1`,
      quantity: 100,
      warehouseId: `${prefix}-WH-1`,
      updatedAt: TIMESTAMP,
    }),
    buildStockLevel({
      sku: `${prefix}-SKU-2`,
      quantity: 50,
      warehouseId: `${prefix}-WH-1`,
      updatedAt: TIMESTAMP,
    }),
    buildStockLevel({
      sku: `${prefix}-SKU-3`,
      quantity: 30,
      warehouseId: `${prefix}-WH-2`,
      updatedAt: TIMESTAMP,
    }),
  ]

  const shipments: Shipment[] = [
    buildShipment({
      id: `${prefix}-SHIP-1`,
      platformShipmentId: `PSHIP-${prefix}-1`,
      orderId: `${prefix}-ORD-3`,
      trackingNumber: `TRK-${prefix}-0001`,
      carrier: `Mock Express ${prefix}`,
      status: 'created',
      items: [buildShipmentItem({ sku: `${prefix}-SKU-2`, quantity: 2 })],
      events: [buildTrackingEvent({ status: 'created', timestamp: TIMESTAMP, description: 'Paket dibuat' })],
    }),
  ]

  return {
    platform,
    prefix,
    carrier: `Mock Express ${prefix}`,
    orders,
    products,
    categories,
    attributes,
    warehouses,
    shipments,
    stock,
  }
}

export function buildMockSeed(platform: PlatformKey, overrides?: Partial<MockSeed>): MockSeed {
  const base = buildDefaultSeed(platform)
  if (overrides === undefined) {
    return base
  }
  return {
    platform: overrides.platform ?? base.platform,
    prefix: overrides.prefix ?? base.prefix,
    carrier: overrides.carrier ?? base.carrier,
    orders: overrides.orders ?? base.orders,
    products: overrides.products ?? base.products,
    categories: overrides.categories ?? base.categories,
    attributes: overrides.attributes ?? base.attributes,
    warehouses: overrides.warehouses ?? base.warehouses,
    shipments: overrides.shipments ?? base.shipments,
    stock: overrides.stock ?? base.stock,
  }
}
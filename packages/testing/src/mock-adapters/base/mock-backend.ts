import type { Category, CategoryAttribute, Order, PlatformKey, Product, Shipment, StockLevel, Warehouse } from '@opensellpy/core'
import { buildShipmentItem, buildTrackingEvent } from '../../fixtures/index.js'
import type { MockSeed } from './seed.js'

export class MockBackend {
  readonly platform: PlatformKey
  readonly prefix: string
  readonly carrier: string
  readonly orders: Order[]
  readonly products: Product[]
  readonly categories: Category[]
  readonly attributes: Record<string, CategoryAttribute[]>
  readonly warehouses: Warehouse[]
  readonly shipments: Shipment[]
  readonly stock: Map<string, StockLevel>
  private readonly seq: { order: number; product: number; shipment: number }

  constructor(seed: MockSeed) {
    this.platform = seed.platform
    this.prefix = seed.prefix
    this.carrier = seed.carrier
    this.orders = structuredClone(seed.orders)
    this.products = structuredClone(seed.products)
    this.categories = structuredClone(seed.categories)
    this.attributes = structuredClone(seed.attributes)
    this.warehouses = structuredClone(seed.warehouses)
    this.shipments = structuredClone(seed.shipments)
    this.stock = new Map(seed.stock.map((s) => [s.sku, structuredClone(s)]))
    this.seq = {
      order: this.orders.length,
      product: this.products.length,
      shipment: this.shipments.length,
    }
  }

  nextOrderId(): string {
    this.seq.order += 1
    return `${this.prefix}-ORD-${this.seq.order}`
  }

  nextProductId(): string {
    this.seq.product += 1
    return `${this.prefix}-PRD-${this.seq.product}`
  }

  nextShipmentIds(): { id: string; platformShipmentId: string; trackingNumber: string } {
    this.seq.shipment += 1
    const sequence = String(this.seq.shipment).padStart(4, '0')
    return {
      id: `${this.prefix}-SHIP-${this.seq.shipment}`,
      platformShipmentId: `PSHIP-${this.prefix}-${sequence}`,
      trackingNumber: `TRK-${this.prefix}-${sequence}`,
    }
  }

  addShipmentForOrder(order: Order): Shipment {
    const identity = this.nextShipmentIds()
    const shipment: Shipment = {
      id: identity.id,
      platformShipmentId: identity.platformShipmentId,
      orderId: order.id,
      trackingNumber: identity.trackingNumber,
      carrier: this.carrier,
      status: 'created',
      items: order.items.map((item) => buildShipmentItem({ sku: item.sku, quantity: item.quantity })),
      events: [buildTrackingEvent({ status: 'created', timestamp: new Date().toISOString(), description: 'Paket dibuat otomatis' })],
      raw: { source: 'mock', autoCreated: true },
    }
    this.shipments.push(shipment)
    return shipment
  }
}
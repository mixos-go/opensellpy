import { NotFoundError } from '@opensellpy/core'
import type { CreateShipmentInput, ILogisticsProvider, Shipment, ShipmentItem } from '@opensellpy/core'
import { buildShipmentItem, buildTrackingEvent } from '../../fixtures/index.js'
import type { MockBackend } from './mock-backend.js'

export class MockLogisticsProvider implements ILogisticsProvider {
  constructor(private readonly backend: MockBackend) {}

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    const order = this.backend.orders.find((candidate) => candidate.id === input.orderId)
    if (order === undefined) {
      throw new NotFoundError(`Order ${input.orderId} tidak ditemukan`, { platform: this.backend.platform })
    }
    const existing = this.backend.shipments.find((candidate) => candidate.orderId === input.orderId)
    if (existing !== undefined) {
      return structuredClone(existing)
    }
    const items: ShipmentItem[] =
      input.items === undefined
        ? order.items.map((item) => buildShipmentItem({ sku: item.sku, quantity: item.quantity }))
        : structuredClone(input.items)
    const identity = this.backend.nextShipmentIds()
    const shipment: Shipment = {
      id: identity.id,
      platformShipmentId: identity.platformShipmentId,
      orderId: order.id,
      trackingNumber: identity.trackingNumber,
      carrier: this.backend.carrier,
      status: 'created',
      items,
      events: [buildTrackingEvent({ status: 'created', timestamp: new Date().toISOString(), description: 'Paket dibuat' })],
      raw: { source: 'mock' },
    }
    this.backend.shipments.push(shipment)
    return structuredClone(shipment)
  }

  async getTracking(shipmentId: string): Promise<Shipment> {
    return structuredClone(this.find(shipmentId))
  }

  async cancelShipment(shipmentId: string): Promise<void> {
    const shipment = this.find(shipmentId)
    if (shipment.status === 'cancelled') {
      return
    }
    shipment.status = 'cancelled'
    shipment.events.push(
      buildTrackingEvent({ status: 'cancelled', timestamp: new Date().toISOString(), description: 'Shipment dibatalkan' }),
    )
  }

  private find(shipmentId: string): Shipment {
    const shipment = this.backend.shipments.find(
      (candidate) => candidate.id === shipmentId || candidate.platformShipmentId === shipmentId,
    )
    if (shipment === undefined) {
      throw new NotFoundError(`Shipment ${shipmentId} tidak ditemukan`, { platform: this.backend.platform })
    }
    return shipment
  }
}
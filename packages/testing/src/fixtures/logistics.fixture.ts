import type { Shipment, ShipmentItem, TrackingEvent } from '@mixos-go/opensellpy-core'

export function buildTrackingEvent(overrides?: Partial<TrackingEvent>): TrackingEvent {
  const base: TrackingEvent = {
    status: 'created',
    location: 'Jakarta',
    timestamp: '2024-01-10T08:00:00.000Z',
    description: 'Paket dibuat',
  }
  return { ...base, ...overrides } as TrackingEvent
}

export function buildShipmentItem(overrides?: Partial<ShipmentItem>): ShipmentItem {
  const base: ShipmentItem = {
    sku: 'SKU-1',
    quantity: 1,
  }
  return { ...base, ...overrides } as ShipmentItem
}

export function buildShipment(overrides?: Partial<Shipment>): Shipment {
  const base: Shipment = {
    id: 'SHIP-1',
    platformShipmentId: 'PLAT-SHIP-1',
    orderId: 'ORD-1',
    trackingNumber: 'TRK-0001',
    carrier: 'Mock Express',
    status: 'created',
    items: [buildShipmentItem()],
    events: [buildTrackingEvent()],
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as Shipment
}
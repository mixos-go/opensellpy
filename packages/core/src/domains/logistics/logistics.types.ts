export type ShipmentStatus = 'created' | 'picked' | 'in-transit' | 'delivered' | 'cancelled' | 'failed'

export interface TrackingEvent {
  status: ShipmentStatus
  location?: string
  timestamp: string
  description?: string
}

export interface ShipmentItem {
  sku: string
  quantity: number
}

export interface Shipment {
  id: string
  platformShipmentId: string
  orderId: string
  trackingNumber?: string
  carrier?: string
  status: ShipmentStatus
  items: ShipmentItem[]
  events: TrackingEvent[]
  raw: unknown
}

export interface CreateShipmentInput {
  orderId: string
  items?: ShipmentItem[]
}

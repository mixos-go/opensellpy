import type { Shipment, ShipmentStatus, TrackingEvent } from '@opensellpy/core'

/** Bentuk minimal raw tracking dari order tracking (TikTok Shop). */
export interface RawTiktokTracking {
  order_id?: string
  tracking?: Array<{
    display_status?: string
    tracking_number?: string
    shipping_provider?: string
    shipment_order_detail?: RawTiktokTrackingEvent[]
  }>
}

export interface RawTiktokTrackingEvent {
  logistics_status?: string
  description?: string
  happen_time?: number
}

/** Map logistics_status TikTok → ShipmentStatus domain. Default: `created`. */
export function fromTiktokLogisticsStatus(raw: string | undefined): ShipmentStatus {
  switch (raw) {
    case 'PICKED':
    case 'ARRANGED':
    case 'PACKED':
      return 'picked'
    case 'SHIPPED':
    case 'IN_TRANSIT':
    case 'DELAYED':
      return 'in-transit'
    case 'DELIVERED':
      return 'delivered'
    case 'CANCELLED':
      return 'cancelled'
    case 'FAILED':
    case 'RETURNED':
      return 'failed'
    default:
      return 'created'
  }
}

function mapEvent(raw: RawTiktokTrackingEvent): TrackingEvent {
  return {
    status: fromTiktokLogisticsStatus(raw.logistics_status),
    timestamp:
      raw.happen_time === undefined
        ? new Date(0).toISOString()
        : new Date(raw.happen_time * 1000).toISOString(),
    ...(raw.description !== undefined ? { description: raw.description } : {}),
  }
}

/** Map raw tracking TikTok → Shipment domain (id/halaman & items diisi caller). */
export function fromTiktokTracking(
  raw: RawTiktokTracking,
  opts: { shipmentId: string; orderId: string; items: Shipment['items'] },
): Shipment {
  const first = raw.tracking?.at(0)
  const events = (first?.shipment_order_detail ?? []).map(mapEvent)
  return {
    id: opts.shipmentId,
    platformShipmentId: opts.shipmentId,
    orderId: opts.orderId,
    ...(first?.tracking_number !== undefined && first.tracking_number !== ''
      ? { trackingNumber: first.tracking_number }
      : {}),
    ...(first?.shipping_provider !== undefined && first.shipping_provider !== ''
      ? { carrier: first.shipping_provider }
      : {}),
    status: events.length > 0 ? events[events.length - 1]?.status ?? 'created' : first?.display_status !== undefined ? fromTiktokLogisticsStatus(first.display_status) : 'created',
    items: opts.items,
    events,
    raw,
  }
}
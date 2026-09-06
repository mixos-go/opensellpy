import type { Shipment, ShipmentStatus, TrackingEvent } from '@mixos-go/opensellpy-core'

export interface RawTrackingInfo {
  order_sn?: string
  package_number?: string
  logistics_status?: string
  tracking_info?: RawTrackingEvent[]
}

export interface RawTrackingEvent {
  update_time?: number
  description?: string
  logistics_status?: string
}

/** Map logistics_status Shopee → ShipmentStatus domain. Default: `created`. */
export function fromShopeeLogisticsStatus(raw: string | undefined): ShipmentStatus {
  switch (raw) {
    case 'PICKUP':
      return 'picked'
    case 'IN_TRANSIT':
      return 'in-transit'
    case 'DELIVERED':
      return 'delivered'
    case 'CANCELLED':
      return 'cancelled'
    case 'FAILED':
      return 'failed'
    default:
      return 'created'
  }
}

function mapEvent(raw: RawTrackingEvent): TrackingEvent {
  return {
    status: fromShopeeLogisticsStatus(raw.logistics_status),
    timestamp:
      raw.update_time === undefined
        ? new Date(0).toISOString()
        : new Date(raw.update_time * 1000).toISOString(),
    ...(raw.description !== undefined ? { description: raw.description } : {}),
  }
}

/** Map tracking info Shopee → Shipment domain (orderId & trackingNumber diisi caller). */
export function fromShopeeTrackingInfo(
  raw: RawTrackingInfo,
  opts: { orderId: string; trackingNumber?: string },
): Shipment {
  const packageNumber = raw.package_number ?? ''
  const events = (raw.tracking_info ?? []).map(mapEvent)
  return {
    id: packageNumber,
    platformShipmentId: packageNumber,
    orderId: opts.orderId,
    ...(opts.trackingNumber !== undefined ? { trackingNumber: opts.trackingNumber } : {}),
    status: fromShopeeLogisticsStatus(raw.logistics_status),
    items: [],
    events,
    raw,
  }
}
import type { OrderItemStatus, OrderStatus } from '@mixos-go/opensellpy-core'

const TIKTOK_STATUS_BY_OURS: Partial<Record<OrderStatus, string>> = {
  pending: 'UNPAID',
  'ready-to-ship': 'AWAITING_SHIPMENT',
  shipped: 'IN_TRANSIT',
  delivered: 'COMPLETED',
  cancelled: 'CANCELLED',
}

/** Map status filter domain → `order_status` TikTok Shop (string, bila didukung). */
export function toTiktokOrderStatus(status: OrderStatus): string | undefined {
  return TIKTOK_STATUS_BY_OURS[status]
}

/** Map `order_status` TikTok → OrderStatus domain. Default: `pending`. */
export function fromTiktokOrderStatus(raw: string | undefined): OrderStatus {
  switch (raw) {
    case 'UNPAID':
      return 'pending'
    case 'AWAITING_SHIPMENT':
    case 'RTS':
      return 'ready-to-ship'
    case 'AWAITING_COLLECTION':
    case 'IN_TRANSIT':
    case 'PARTIALLY_SHIPPING':
      return 'shipped'
    case 'DELIVERED':
    case 'COMPLETED':
      return 'delivered'
    case 'CANCELLED':
    case 'CANCEL':
    case 'VOIDED':
    case 'EXPIRED':
    case 'CHARGED_BACK':
      return 'cancelled'
    default:
      return 'pending'
  }
}

/**
 * Status item mengikuti status order (TikTok tidak memberi status per line item
 * pada order search/detail).
 */
export function fromTiktokOrderStatusToItem(raw: string | undefined): OrderItemStatus {
  switch (fromTiktokOrderStatus(raw)) {
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}
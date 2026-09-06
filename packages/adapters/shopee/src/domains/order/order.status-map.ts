import type { OrderItemStatus, OrderStatus } from '@opensellpy/core'

const SHOPEE_STATUS_BY_OURS: Partial<Record<OrderStatus, string>> = {
  pending: 'UNPAID',
  'ready-to-ship': 'READY_TO_SHIP',
  shipped: 'SHIPPED',
  delivered: 'COMPLETED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED',
}

/** Map status filter domain opensellpy → order_status Shopee (string, bila didukung). */
export function toShopeeOrderStatus(status: OrderStatus): string | undefined {
  return SHOPEE_STATUS_BY_OURS[status]
}

/** Map order_status Shopee → OrderStatus domain. Default: `pending`. */
export function fromShopeeOrderStatus(raw: string | undefined): OrderStatus {
  switch (raw) {
    case 'UNPAID':
      return 'pending'
    case 'READY_TO_SHIP':
    case 'RETRY_SHIP':
    case 'PROCESSED':
      return 'ready-to-ship'
    case 'SHIPPED':
      return 'shipped'
    case 'TO_CONFIRM_RECEIVE':
    case 'COMPLETED':
      return 'delivered'
    case 'IN_CANCEL':
    case 'CANCELLED':
      return 'cancelled'
    case 'TO_RETURN':
    case 'RETURNED':
      return 'returned'
    default:
      return 'pending'
  }
}

/**
 * Status item mengikuti status order (Shopee tidak memberi status per item
 * pada get_order_list/detail).
 */
export function fromShopeeOrderStatusToItem(raw: string | undefined): OrderItemStatus {
  switch (fromShopeeOrderStatus(raw)) {
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    case 'returned':
      return 'returned'
    default:
      return 'pending'
  }
}
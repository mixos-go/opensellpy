import type { OrderItemStatus, OrderStatus } from '@opensellpy/core'

/**
 * Map status filter domain → `filter.orderItemStatuses` Order List V2 Blibli.
 * Status yang tidak punya kode filter (pending/failed) → `undefined` (tanpa
 * filter status, ambil semua).
 */
export function toBlibliOrderStatuses(status: OrderStatus | undefined): string[] | undefined {
  switch (status) {
    case 'ready-to-ship':
      return ['FP', 'BP']
    case 'shipped':
      return ['FR']
    case 'delivered':
      return ['D']
    case 'cancelled':
      return ['CX']
    case 'returned':
      return ['RT', 'VB']
    case 'failed':
      return ['CX']
    default:
      return undefined
  }
}

/** Map status order-item Blibli → OrderStatus domain. Default: `pending`. */
export function fromBlibliOrderStatus(raw: string | undefined): OrderStatus {
  switch (raw) {
    case 'FP':
    case 'BP':
    case 'BOPIS':
      return 'ready-to-ship'
    case 'FR':
      return 'shipped'
    case 'D':
      return 'delivered'
    case 'CX':
      return 'cancelled'
    case 'RT':
    case 'VB':
      return 'returned'
    default:
      return 'pending'
  }
}

/** Map status order-item Blibli → OrderItemStatus domain. Default: `pending`. */
export function fromBlibliOrderStatusToItem(raw: string | undefined): OrderItemStatus {
  switch (raw) {
    case 'FR':
      return 'shipped'
    case 'D':
      return 'delivered'
    case 'CX':
      return 'cancelled'
    case 'RT':
    case 'VB':
      return 'returned'
    default:
      return 'pending'
  }
}
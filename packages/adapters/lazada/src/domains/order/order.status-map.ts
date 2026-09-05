import type { OrderItemStatus, OrderStatus } from '@opensellpy/core'

const LAZADA_STATUS: Record<OrderStatus, string> = {
  pending: 'unpaid',
  'ready-to-ship': 'ready_to_ship',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'canceled',
  returned: 'returned',
  failed: 'failed',
}

const PRIORITY_ORDER: string[] = [
  'delivered',
  'canceled',
  'returned',
  'shipped',
  'shipping',
  'lost',
  'ready_to_ship',
  'toship',
  'topack',
  'pending',
  'unpaid',
  'failed',
]

/** Map status filter domain → status `getOrders` Lazada (lowercased). */
export function toLazadaOrderStatus(status: OrderStatus): string | undefined {
  return LAZADA_STATUS[status]
}

/** Pilih status paling representatif dari array `statuses` Lazada. */
export function pickLazadaOrderStatus(statuses: readonly string[] | undefined): string | undefined {
  if (statuses === undefined || statuses.length === 0) return undefined
  for (const candidate of PRIORITY_ORDER) {
    if (statuses.includes(candidate)) return candidate
  }
  return statuses[0]
}

/** Map status order Lazada → OrderStatus domain. Default: `pending`. */
export function fromLazadaOrderStatus(raw: string | undefined): OrderStatus {
  switch (raw) {
    case 'ready_to_ship':
    case 'toship':
    case 'topack':
      return 'ready-to-ship'
    case 'shipped':
    case 'shipping':
    case 'lost':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'canceled':
      return 'cancelled'
    case 'returned':
      return 'returned'
    case 'failed':
      return 'failed'
    default:
      return 'pending'
  }
}

/** Map status order item Lazada → OrderItemStatus. Default: `pending`. */
export function fromLazadaOrderStatusToItem(raw: string | undefined): OrderItemStatus {
  switch (raw) {
    case 'shipped':
    case 'shipping':
    case 'lost':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'canceled':
      return 'cancelled'
    case 'returned':
      return 'returned'
    case 'failed':
      return 'cancelled'
    default:
      return 'pending'
  }
}
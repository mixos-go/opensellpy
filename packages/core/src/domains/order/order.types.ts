import type { Money } from '../../shared/money.js'
import type { PaginationParams } from '../../shared/pagination.js'

export type OrderStatus =
  | 'pending'
  | 'ready-to-ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'failed'

export type OrderItemStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

export interface OrderItem {
  id: string
  sku: string
  name: string
  quantity: number
  unitPrice: Money
  status: OrderItemStatus
}

export interface OrderAddress {
  name: string
  phone: string
  line1: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  platformOrderId: string
  status: OrderStatus
  items: OrderItem[]
  shippingAddress?: OrderAddress
  total?: Money
  createdAt: string
  updatedAt: string
  raw: unknown
}

export interface ListOrdersParams extends PaginationParams {
  status?: OrderStatus
}

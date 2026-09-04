import type { DomainEvent } from './event.types.js'
import type { Order, OrderStatus } from '../domains/order/order.types.js'

export interface OrderCreatedPayload {
  order: Order
}

export interface OrderStatusChangedPayload {
  orderId: string
  previousStatus: OrderStatus
  newStatus: OrderStatus
}

export type OrderCreatedEvent = DomainEvent<OrderCreatedPayload>
export type OrderStatusChangedEvent = DomainEvent<OrderStatusChangedPayload>

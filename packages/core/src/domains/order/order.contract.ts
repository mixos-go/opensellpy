import type { ListOrdersParams, Order, OrderStatus } from './order.types.js'
import type { PaginatedResult } from '../../shared/pagination.js'

export interface IOrderProvider {
  listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>>
  getOrder(orderId: string): Promise<Order>
  updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<Order>
}

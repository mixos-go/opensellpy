import { NotFoundError } from '@opensellpy/core'
import type { IOrderProvider, ListOrdersParams, Order, OrderItemStatus, OrderStatus, PaginatedResult } from '@opensellpy/core'
import type { MockBackend } from './mock-backend.js'

function itemStatusFor(orderStatus: OrderStatus): OrderItemStatus {
  switch (orderStatus) {
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    case 'returned':
      return 'returned'
    case 'pending':
    case 'ready-to-ship':
    case 'failed':
      return 'pending'
  }
}

export class MockOrderProvider implements IOrderProvider {
  constructor(private readonly backend: MockBackend) {}

  async listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>> {
    const filtered = this.backend.orders
      .filter((order) => (params.status === undefined ? true : order.status === params.status))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    const start = (params.page - 1) * params.limit
    const items = filtered.slice(start, start + params.limit).map((order) => structuredClone(order))
    return {
      items,
      total: filtered.length,
      page: params.page,
      limit: params.limit,
      hasNext: start + params.limit < filtered.length,
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    return structuredClone(this.find(orderId))
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, _reason?: string): Promise<Order> {
    const order = this.find(orderId)
    order.status = status
    order.updatedAt = new Date().toISOString()
    order.items = order.items.map((item) => ({ ...item, status: itemStatusFor(status) }))
    if (status === 'shipped' && !this.backend.shipments.some((s) => s.orderId === order.id)) {
      this.backend.addShipmentForOrder(order)
    }
    return structuredClone(order)
  }

  private find(orderId: string): Order {
    const order = this.backend.orders.find(
      (candidate) => candidate.id === orderId || candidate.platformOrderId === orderId,
    )
    if (order === undefined) {
      throw new NotFoundError(`Order ${orderId} tidak ditemukan`, { platform: this.backend.platform })
    }
    return order
  }
}
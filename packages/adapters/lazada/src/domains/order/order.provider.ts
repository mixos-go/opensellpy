import {
  NotFoundError,
  ValidationError,
  type IOrderProvider,
  type ListOrdersParams,
  type Order,
  type OrderStatus,
  type PaginatedResult,
} from '@mixos-go/opensellpy-core'
import {
  LazadaOrderAPIApi,
  type LazadaClient,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import { callRaw } from '../../client/request.js'
import { mapLazadaError } from '../../errors/lazada-error.mapper.js'
import { LazadaLogisticsProvider } from '../logistics/logistics.provider.js'
import { fromLazadaOrder, type RawLazadaOrder, type RawLazadaOrderItem } from './order.mapper.js'
import { toLazadaListOrdersParams } from './order.params-mapper.js'

interface RawOrdersGet {
  countTotal?: number
  count?: number
  orders?: RawLazadaOrder[]
}

/**
 * Order provider Lazada: orders/get + order/items/get. Transisi `shipped`
 * memakai `createShipment` (pack). Pembatalan order via API tidak didukung
 * (ValidationError).
 */
export class LazadaOrderProvider implements IOrderProvider {
  private readonly connector: LazadaConnector
  private readonly shopId: string

  constructor(connector: LazadaConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>> {
    try {
      const api = new LazadaOrderAPIApi(await this.client())
      const raw = await callRaw<RawOrdersGet>(api.getOrders(toLazadaListOrdersParams(params)))
      const rawOrders = raw.orders ?? []
      const items: Order[] = []
      for (const order of rawOrders) {
        items.push(await this.buildOrder(api, order))
      }
      const count = raw.count ?? items.length
      return {
        items,
        total: raw.countTotal ?? count,
        page: params.page,
        limit: params.limit,
        hasNext: count >= params.limit,
      }
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const api = new LazadaOrderAPIApi(await this.client())
      const raw = await callRaw<RawLazadaOrder>(api.getOrder({ order_id: Number(orderId) }))
      if (raw.order_id === undefined && raw.order_number === undefined) {
        throw new NotFoundError(`Order ${orderId} tidak ditemukan di Lazada`, { platform: 'lazada' })
      }
      return this.buildOrder(api, raw)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, _reason?: string): Promise<Order> {
    try {
      if (status !== 'shipped') {
        throw new ValidationError(
          `Status "${status}" tidak didukung Lazada (hanya shipped via pack).`,
          { platform: 'lazada' },
        )
      }
      await new LazadaLogisticsProvider(this.connector, this.shopId).createShipment({ orderId })
      return this.getOrder(orderId)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  private async client(): Promise<LazadaClient> {
    return this.connector.getClient(this.shopId)
  }

  private async buildOrder(api: LazadaOrderAPIApi, order: RawLazadaOrder): Promise<Order> {
    const items = await callRaw<RawLazadaOrderItem[]>(
      api.getOrderItems({ order_id: Number(order.order_id ?? order.order_number) }),
    )
    const rawItems = Array.isArray(items) ? items : []
    return fromLazadaOrder(order, rawItems, rawItems[0]?.currency)
  }
}
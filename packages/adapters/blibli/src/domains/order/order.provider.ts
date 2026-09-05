import { randomUUID } from 'node:crypto'
import {
  NotFoundError,
  ValidationError,
  type IOrderProvider,
  type ListOrdersParams,
  type Order,
  type OrderStatus,
  type PaginatedResult,
} from '@opensellpy/core'
import type {
  BlibliClient,
  BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliRequestMeta } from '../../config.js'
import { callEnvelope, callRaw } from '../../client/request.js'
import { mapBlibliError } from '../../errors/blibli-error.mapper.js'
import { BlibliLogisticsProvider } from '../logistics/logistics.provider.js'
import {
  fromBlibliOrderDetail,
  fromBlibliPackageList,
  type RawBlibliOrderDetail,
  type RawBlibliPackage,
} from './order.mapper.js'
import { toBlibliOrderListBody } from './order.params-mapper.js'
import { ORDER_DETAIL_V2, ORDER_LIST_V2 } from './order.spec.js'

interface RawOrderListEnvelope {
  content?: RawBlibliPackage[]
  paging?: { pageNumber?: number; pageSize?: number; totalPage?: number; totalRecord?: number }
}

/**
 * Order provider Blibli. Satu Order domain = satu order-item Blibli (line
 * produk); id = `itemId` (order-item-id) yang dipakai utk detail &
 * fulfillment. Transisi `shipped` = pack+fulfill via createShipment.
 */
export class BlibliOrderProvider implements IOrderProvider {
  private readonly connector: BlibliConnector
  private readonly shopId: string
  private readonly meta: BlibliRequestMeta

  constructor(connector: BlibliConnector, shopId: string, meta: BlibliRequestMeta) {
    this.connector = connector
    this.shopId = shopId
    this.meta = meta
  }

  async listOrders(params: ListOrdersParams): Promise<PaginatedResult<Order>> {
    try {
      const client = await this.client()
      const env = await callEnvelope(client, ORDER_LIST_V2, this.params(toBlibliOrderListBody(params)))
      const raw = env as RawOrderListEnvelope
      const items = fromBlibliPackageList(raw.content ?? [])
      const paging = raw.paging
      return {
        items,
        total: paging?.totalRecord ?? items.length,
        page: params.page,
        limit: params.limit,
        hasNext:
          paging?.totalPage === undefined
            ? items.length >= params.limit
            : paging.pageNumber !== undefined &&
              paging.pageNumber + 1 < (paging.totalPage ?? 1),
      }
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const content = await this.getOrderDetail(orderId)
      return fromBlibliOrderDetail(content)
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, _reason?: string): Promise<Order> {
    try {
      if (status !== 'shipped') {
        throw new ValidationError(
          `Status "${status}" tidak didukung Blibli (hanya shipped via fulfill).`,
          { platform: 'blibli' },
        )
      }
      await new BlibliLogisticsProvider(this.connector, this.shopId, this.meta).createShipment({
        orderId,
      })
      return this.getOrder(orderId)
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  /** Content Order Detail V2 utk order-item id. */
  async getOrderDetail(itemId: string): Promise<RawBlibliOrderDetail> {
    const client = await this.client()
    const content = await callRaw<RawBlibliOrderDetail>(
      client,
      ORDER_DETAIL_V2,
      this.params({ 'order-item-id': itemId }),
    )
    if (content === null || (content.itemId === undefined && content.id === undefined)) {
      throw new NotFoundError(`Order ${itemId} tidak ditemukan di Blibli`, { platform: 'blibli' })
    }
    return content
  }

  private params(extra: Record<string, unknown>): Record<string, unknown> {
    return {
      requestId: randomUUID(),
      storeCode: this.meta.storeCode,
      username: this.meta.username,
      storeId: this.meta.storeId,
      channelId: this.meta.channelId,
      ...extra,
    }
  }

  private async client(): Promise<BlibliClient> {
    return this.connector.getClient(this.shopId)
  }
}
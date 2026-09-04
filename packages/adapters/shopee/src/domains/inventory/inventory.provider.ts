import {
  NotFoundError,
  type IInventoryProvider,
  type StockLevel,
  type UpdateStockInput,
  type Warehouse,
} from '@opensellpy/core'
import type { ApiCallSpec, ShopeeConnector } from '@mixos-go/shopee-sdk'
import { callRaw } from '../../client/request.js'
import { mapShopeeError } from '../../errors/shopee-error.mapper.js'
import { fromShopeeStockLevel, type RawInventoryItem } from './inventory.mapper.js'
import { toShopeeUpdateStockBody } from './inventory.params-mapper.js'

const ITEM_LIST_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/product/get_item_list',
  query: ['offset', 'page_size', 'item_status'],
  body: [],
  scope: 'shop',
}

const ITEM_BASE_INFO_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/product/get_item_base_info',
  query: ['item_id_list'],
  body: [],
  scope: 'shop',
}

const UPDATE_STOCK_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/product/update_stock',
  query: [],
  body: ['item_id', 'stock_list'],
  scope: 'shop',
}

const SCAN_STATUSES: readonly string[] = ['NORMAL', 'UNLIST', 'REVIEWING']
const SCAN_PAGE_SIZE = 100

interface RawItemListResponse {
  item?: Array<{ item_id?: number }>
}

interface RawItemBaseInfoResponse {
  item_list?: RawInventoryItem[]
}

interface RawFoundItem {
  itemId: number
  raw: RawInventoryItem
}

/**
 * Inventory provider Shopee. Shopee tidak punya endpoint daftar gudang global;
 * lokasi di-manage per item. SDK-level stock di-agregasi ke satu lokasi
 * `DEFAULT`. getStock/updateStock mencari item via item_sku.
 */
export class ShopeeInventoryProvider implements IInventoryProvider {
  private readonly connector: ShopeeConnector
  private readonly shopId: string

  constructor(connector: ShopeeConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listWarehouses(): Promise<Warehouse[]> {
    try {
      return [
        {
          id: 'DEFAULT',
          name: 'Default',
          raw: {
            note: 'Shopee tidak memiliki endpoint daftar gudang; stok dikelola per lokasi default shop.',
          },
        },
      ]
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async getStock(sku: string): Promise<StockLevel> {
    try {
      const found = await this.findItemBySku(sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${sku} tidak ditemukan di Shopee`, { platform: 'shopee' })
      }
      return fromShopeeStockLevel(sku, found.raw)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async updateStock(input: UpdateStockInput): Promise<StockLevel> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const found = await this.findItemBySku(input.sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${input.sku} tidak ditemukan di Shopee`, { platform: 'shopee' })
      }
      await callRaw<Record<string, never>>(
        client,
        UPDATE_STOCK_SPEC,
        toShopeeUpdateStockBody(found.itemId, input),
      )
      return this.getStock(input.sku)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  private async findItemBySku(sku: string): Promise<RawFoundItem | undefined> {
    const client = await this.connector.getClient(this.shopId)
    const ids: number[] = []
    for (const status of SCAN_STATUSES) {
      const res = await callRaw<RawItemListResponse>(client, ITEM_LIST_SPEC, {
        offset: 0,
        page_size: SCAN_PAGE_SIZE,
        item_status: status,
      })
      for (const it of res.item ?? []) {
        if (it.item_id !== undefined) ids.push(it.item_id)
      }
    }
    const chunks: number[][] = []
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))
    for (const chunk of chunks) {
      const res = await callRaw<RawItemBaseInfoResponse>(client, ITEM_BASE_INFO_SPEC, {
        item_id_list: chunk,
      })
      for (const item of res.item_list ?? []) {
        if (item.item_sku === sku && item.item_id !== undefined) {
          return { itemId: item.item_id, raw: item }
        }
      }
    }
    return undefined
  }
}
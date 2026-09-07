import {
  NotFoundError,
  type IInventoryProvider,
  type StockLevel,
  type UpdateStockInput,
  type Warehouse,
} from '@mixos-go/opensellpy-core'
import type { ApiCallSpec, TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { callRaw } from '../../client/request.js'
import { mapTiktokError } from '../../errors/tiktok-error.mapper.js'
import {
  fromTiktokStockLevel,
  type RawTiktokSkuStock,
} from './inventory.mapper.js'
import { toTiktokUpdateInventoryBody } from './inventory.params-mapper.js'

const PRODUCT_SEARCH_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/product/202502/products/search',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['page_size', 'page_token', 'shop_cipher'],
  headers: [],
  pathParams: [],
  body: ['audit_status', 'category_version', 'create_time_ge', 'create_time_le', 'listing_platforms', 'listing_quality_tiers', 'return_draft_version', 'seller_skus', 'sku_ids', 'sns_filter', 'status', 'update_time_ge', 'update_time_le'],
}

const PRODUCT_DETAIL_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/product/202309/products/{product_id}',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['product_id'],
  body: [],
}

const UPDATE_INVENTORY_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/product/202309/products/{product_id}/inventory/update',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['product_id'],
  body: ['skus'],
}

const WAREHOUSE_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/logistics/202309/warehouses',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: [],
  body: [],
}

interface RawWarehouse {
  id?: string
  name?: string
  region_code?: string
  area_code?: string
}

interface RawWarehouseResponse {
  warehouses?: RawWarehouse[]
}

interface RawProductSearchResponse {
  products?: Array<{ id?: string }>
}

/** Detail product TikTok (GET /product/202309/products/{id}) — `data` langsung product (flat). */
interface RawProductDetailFlat {
  id?: string
  update_time?: number
  skus?: RawTiktokSkuStock[]
  [key: string]: unknown
}

interface RawFoundSku {
  productId: string
  skuId: string
  product: { update_time?: number }
  rawSku: RawTiktokSkuStock
}

/**
 * Inventory provider TikTok Shop. `listWarehouses` pakai `/logistics/202309/warehouses`;
 * getStock/updateStock mencari SKU via products/search + product detail, lalu stok
 * di-update SKU-level (`inventory/update`).
 */
export class TiktokInventoryProvider implements IInventoryProvider {
  private readonly connector: TikTokShopConnector
  private readonly shopId: string

  constructor(connector: TikTokShopConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listWarehouses(): Promise<Warehouse[]> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawWarehouseResponse>(client, WAREHOUSE_SPEC, {})
      return (res.warehouses ?? []).map((w) => ({
        id: w.id ?? '',
        name: w.name ?? '',
        ...(w.region_code !== undefined ? { address: w.region_code } : {}),
        raw: w,
      }))
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async getStock(sku: string): Promise<StockLevel> {
    try {
      const found = await this.findSku(sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${sku} tidak ditemukan di TikTok Shop`, { platform: 'tts' })
      }
      return fromTiktokStockLevel(sku, found.product, found.rawSku)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async updateStock(input: UpdateStockInput): Promise<StockLevel> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const found = await this.findSku(input.sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${input.sku} tidak ditemukan di TikTok Shop`, {
          platform: 'tts',
        })
      }
      await callRaw<Record<string, never>>(
        client,
        UPDATE_INVENTORY_SPEC,
        { product_id: found.productId, ...toTiktokUpdateInventoryBody(found.skuId, input.quantity) },
      )
      return this.getStock(input.sku)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  private async findSku(sku: string): Promise<RawFoundSku | undefined> {
    const client = await this.connector.getClient(this.shopId)
    const search = await callRaw<RawProductSearchResponse>(client, PRODUCT_SEARCH_SPEC, {
      page_size: 100,
      seller_skus: [sku],
    })
    const ids = (search.products ?? [])
      .map((p) => p.id)
      .filter((id): id is string => id !== undefined && id !== '')
    for (const productId of ids) {
      // GET /product/202309/products/{product_id} → `data` LANGSUNG product (flat).
      const product = await callRaw<RawProductDetailFlat>(client, PRODUCT_DETAIL_SPEC, {
        product_id: productId,
      })
      if (product === undefined || product.id === undefined) continue
      const rawSku = (product.skus ?? []).find((s) => s.seller_sku === sku)
      if (rawSku === undefined) continue
      return { productId, skuId: rawSku.id ?? '', product, rawSku }
    }
    return undefined
  }
}
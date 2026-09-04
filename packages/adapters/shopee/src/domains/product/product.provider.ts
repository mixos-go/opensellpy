import {
  NotFoundError,
  ValidationError,
  type CreateProductInput,
  type IProductProvider,
  type ListProductsParams,
  type PaginatedResult,
  type Product,
  type UpdateProductInput,
} from '@opensellpy/core'
import type { ApiCallSpec, ShopeeClient, ShopeeConnector } from '@mixos-go/shopee-sdk'
import { callRaw } from '../../client/request.js'
import { mapShopeeError } from '../../errors/shopee-error.mapper.js'
import { fromShopeeItemBaseInfo, type RawItemBaseInfo } from './product.mapper.js'
import { toShopeeListProductsParams } from './product.params-mapper.js'
import { toShopeeItemStatus } from './product.status-map.js'

const ITEM_LIST_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/product/get_item_list',
  query: ['offset', 'page_size', 'update_time_from', 'update_time_to', 'item_status'],
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

const ADD_ITEM_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/product/add_item',
  query: [],
  body: [
    'original_price',
    'description',
    'weight',
    'item_name',
    'item_status',
    'dimension',
    'logistic_info',
    'attribute_list',
    'category_id',
    'image',
    'pre_order',
    'item_sku',
    'condition',
    'wholesale',
    'video_upload_id',
    'brand',
    'item_dangerous',
    'tax_info',
    'complaint_policy',
    'description_info',
    'description_type',
    'seller_stock',
  ],
  scope: 'shop',
}

const UPDATE_ITEM_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/api/v2/product/update_item',
  query: [],
  body: [
    'description',
    'weight',
    'pre_order',
    'item_name',
    'attribute_list',
    'image',
    'item_sku',
    'item_status',
    'logistic_info',
    'wholesale',
    'item_id',
    'category_id',
    'dimension',
    'condition',
    'video_upload_id',
    'brand',
    'item_dangerous',
    'tax_info',
    'complaint_policy',
    'description_info',
    'description_type',
  ],
  scope: 'shop',
}

/** get_item_base_info maksimal 50 item_id per panggilan. */
const BASE_INFO_CHUNK_SIZE = 50

interface RawItemListResponse {
  item?: Array<{ item_id?: number }>
  total_count?: number
  has_next_page?: boolean
}

interface RawItemBaseInfoResponse {
  item_list?: RawItemBaseInfo[]
}

interface RawAddItemResponse {
  item_id?: number
}

/**
 * Product provider Shopee: get_item_list → get_item_base_info → add_item /
 * update_item. Item dengan status aktif (`NORMAL`) = default.
 */
export class ShopeeProductProvider implements IProductProvider {
  private readonly connector: ShopeeConnector
  private readonly shopId: string

  constructor(connector: ShopeeConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const listRes = await callRaw<RawItemListResponse>(
        client,
        ITEM_LIST_SPEC,
        toShopeeListProductsParams(params),
      )
      const ids = (listRes.item ?? []).map((it) => it.item_id).filter((id): id is number => id !== undefined)
      if (ids.length === 0) {
        return { items: [], total: listRes.total_count ?? 0, page: params.page, limit: params.limit, hasNext: false }
      }

      const bases = await this.fetchBaseInfos(client, ids)
      const items = bases.map(fromShopeeItemBaseInfo)
      return {
        items,
        total: listRes.total_count ?? items.length,
        page: params.page,
        limit: params.limit,
        hasNext: listRes.has_next_page === true,
      }
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawItemBaseInfoResponse>(client, ITEM_BASE_INFO_SPEC, {
        item_id_list: [Number(productId)],
      })
      const raw = res.item_list?.at(0)
      if (raw === undefined) {
        throw new NotFoundError(`Produk ${productId} tidak ditemukan di Shopee`, { platform: 'shopee' })
      }
      return fromShopeeItemBaseInfo(raw)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      if (input.categoryId === undefined) {
        throw new ValidationError('Shopee butuh categoryId untuk menambahkan produk.', { platform: 'shopee' })
      }
      const baseVariant = input.variants.at(0)
      if (baseVariant === undefined) {
        throw new ValidationError('Shopee butuh minimal satu variant (harga) untuk menambahkan produk.', {
          platform: 'shopee',
        })
      }
      const body: Record<string, unknown> = {
        item_name: input.name,
        category_id: Number(input.categoryId),
        original_price: baseVariant.price.amount,
        description: input.description ?? '',
        weight: 1,
        item_status: 'NORMAL',
        item_sku: baseVariant.sku,
      }
      if (input.images.length > 0) body['image'] = { image_id_list: input.images }
      const res = await callRaw<RawAddItemResponse>(client, ADD_ITEM_SPEC, body)
      if (res.item_id === undefined) {
        throw new ValidationError('add_item Shopee berhasil tanpa item_id.', { platform: 'shopee' })
      }
      return this.getProduct(String(res.item_id))
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const body: Record<string, unknown> = { item_id: Number(productId) }
      if (input.name !== undefined) body['item_name'] = input.name
      if (input.description !== undefined) body['description'] = input.description
      if (input.status !== undefined) body['item_status'] = toShopeeItemStatus(input.status)
      if (input.categoryId !== undefined) body['category_id'] = Number(input.categoryId)
      if (input.images !== undefined && input.images.length > 0) {
        body['image'] = { image_id_list: input.images }
      }
      await callRaw<Record<string, never>>(client, UPDATE_ITEM_SPEC, body)
      return this.getProduct(productId)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  private async fetchBaseInfos(
    client: ShopeeClient,
    ids: number[],
  ): Promise<RawItemBaseInfo[]> {
    const chunks: number[][] = []
    for (let i = 0; i < ids.length; i += BASE_INFO_CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + BASE_INFO_CHUNK_SIZE))
    }
    const collected: RawItemBaseInfo[] = []
    for (const chunk of chunks) {
      const res = await callRaw<RawItemBaseInfoResponse>(client, ITEM_BASE_INFO_SPEC, {
        item_id_list: chunk,
      })
      for (const base of res.item_list ?? []) collected.push(base)
    }
    // Urutkan ulang sesuai urutan id masukan.
    const byId = new Map(collected.map((b) => [b.item_id, b]))
    return ids.map((id) => byId.get(id)).filter((b): b is RawItemBaseInfo => b !== undefined)
  }
}
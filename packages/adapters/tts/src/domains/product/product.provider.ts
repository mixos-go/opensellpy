import {
  NotFoundError,
  ValidationError,
  type CreateProductInput,
  type IProductProvider,
  type ListProductsParams,
  type PaginatedResult,
  type Product,
  type UpdateProductInput,
} from '@mixos-go/opensellpy-core'
import type { ApiCallSpec, TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { callRaw } from '../../client/request.js'
import { mapTiktokError } from '../../errors/tiktok-error.mapper.js'
import { fromTiktokProduct, type RawTiktokProduct } from './product.mapper.js'
import { toTiktokSearchProductsBody } from './product.params-mapper.js'

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
  query: ['return_under_review_version', 'return_draft_version', 'locale', 'shop_cipher'],
  headers: [],
  pathParams: ['product_id'],
  body: [],
}

const CREATE_PRODUCT_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/product/202309/products',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: [],
  body: ['brand_id', 'category_id', 'category_version', 'certifications', 'delivery_option_ids', 'description', 'external_product_id', 'idempotency_key', 'is_cod_allowed', 'is_not_for_sale', 'is_pre_owned', 'listing_platforms', 'main_images', 'manufacturer_ids', 'minimum_order_quantity', 'package_dimensions', 'package_weight', 'primary_combined_product_id', 'product_attributes', 'responsible_person_ids', 'save_mode', 'shipping_insurance_requirement', 'shipping_template_id', 'size_chart', 'skus', 'title', 'video'],
}

const UPDATE_PRODUCT_SPEC: ApiCallSpec = {
  method: 'PUT',
  path: '/product/202509/products/{product_id}',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: ['product_id'],
  body: ['category_id', 'description', 'external_product_id', 'main_images', 'title'],
}

const ACTIVATE_PRODUCT_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/product/202309/products/activate',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: [],
  body: ['listing_platforms', 'product_ids'],
}

const DEACTIVATE_PRODUCT_SPEC: ApiCallSpec = {
  method: 'POST',
  path: '/product/202309/products/deactivate',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['shop_cipher'],
  headers: [],
  pathParams: [],
  body: ['listing_platforms', 'product_ids'],
}

interface RawProductSearchResponse {
  products?: Array<{ id?: string }>
  next_page_token?: string
}

interface RawProductDetailResponse {
  product?: RawTiktokProduct
}

interface RawCreateProductResponse {
  product_id?: string
}

/**
 * Product provider TikTok Shop: products/search → product detail → create /
 * update (202509) + activate/deactivate utk status.
 */
export class TiktokProductProvider implements IProductProvider {
  private readonly connector: TikTokShopConnector
  private readonly shopId: string

  constructor(connector: TikTokShopConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const query: Record<string, unknown> = { page_size: params.limit }
      const res = await callRaw<RawProductSearchResponse>(
        client,
        PRODUCT_SEARCH_SPEC,
        { ...query, ...toTiktokSearchProductsBody(params) },
      )
      const ids = (res.products ?? [])
        .map((p) => p.id)
        .filter((id): id is string => id !== undefined && id !== '')
      const items = []
      for (const id of ids) {
        try {
          items.push(await this.getProduct(id))
        } catch (err: unknown) {
          if (err instanceof NotFoundError) continue
          throw err
        }
      }
      return {
        items,
        total: items.length,
        page: params.page,
        limit: params.limit,
        hasNext: res.next_page_token !== undefined && res.next_page_token !== '',
      }
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawProductDetailResponse>(client, PRODUCT_DETAIL_SPEC, {
        product_id: productId,
      })
      const raw = res.product
      if (raw === undefined) {
        throw new NotFoundError(`Produk ${productId} tidak ditemukan di TikTok Shop`, { platform: 'tts' })
      }
      return fromTiktokProduct(raw)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      if (input.categoryId === undefined) {
        throw new ValidationError('TikTok butuh categoryId untuk menambahkan produk.', { platform: 'tts' })
      }
      const variants = input.variants.map((v) => ({
        seller_sku: v.sku,
        price: String(v.price.amount),
      }))
      const body: Record<string, unknown> = {
        category_id: input.categoryId,
        title: input.name,
        description: input.description ?? '',
        is_not_for_sale: false,
        main_images: input.images.map((u) => ({ uri: u })),
        skus: variants,
      }
      const res = await callRaw<RawCreateProductResponse>(client, CREATE_PRODUCT_SPEC, body)
      if (res.product_id === undefined || res.product_id === '') {
        throw new ValidationError('create product TikTok berhasil tanpa product_id.', { platform: 'tts' })
      }
      return this.getProduct(res.product_id)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const body: Record<string, unknown> = {}
      if (input.name !== undefined) body['title'] = input.name
      if (input.description !== undefined) body['description'] = input.description
      if (input.categoryId !== undefined) body['category_id'] = input.categoryId
      if (input.images !== undefined && input.images.length > 0) {
        body['main_images'] = input.images.map((u) => ({ uri: u }))
      }
      if (Object.keys(body).length > 0) {
        await callRaw<Record<string, never>>(client, UPDATE_PRODUCT_SPEC, {
          product_id: productId,
          ...body,
        })
      }
      if (input.status === 'active') {
        await callRaw<Record<string, never>>(client, ACTIVATE_PRODUCT_SPEC, {
          product_ids: [productId],
        })
      } else if (input.status === 'inactive') {
        await callRaw<Record<string, never>>(client, DEACTIVATE_PRODUCT_SPEC, {
          product_ids: [productId],
        })
      }
      return this.getProduct(productId)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }
}
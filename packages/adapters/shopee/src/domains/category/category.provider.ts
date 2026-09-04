import {
  NotFoundError,
  type Category,
  type CategoryAttribute,
  type ICategoryProvider,
} from '@opensellpy/core'
import type { ApiCallSpec, ShopeeConnector } from '@mixos-go/shopee-sdk'
import { callRaw } from '../../client/request.js'
import { mapShopeeError } from '../../errors/shopee-error.mapper.js'
import {
  fromShopeeAttributeList,
  fromShopeeCategoryList,
  type RawAttribute,
  type RawCategory,
} from './category.mapper.js'

const CATEGORY_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/product/get_category',
  query: ['language'],
  body: [],
  scope: 'shop',
}

const ATTRIBUTE_TREE_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/api/v2/product/get_attribute_tree',
  query: ['category_id_list', 'language'],
  body: [],
  scope: 'shop',
}

interface RawCategoryResponse {
  category_list?: RawCategory[]
}

interface RawAttributeTreeResponse {
  list?: Array<{
    category_id?: number
    attribute_tree?: RawAttribute[]
  }>
}

/**
 * Category provider Shopee: pohon kategori + attribute tree per kategori.
 * Bahasa default `en` (pakai display_category_name).
 */
export class ShopeeCategoryProvider implements ICategoryProvider {
  private readonly connector: ShopeeConnector
  private readonly shopId: string

  constructor(connector: ShopeeConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawCategoryResponse>(client, CATEGORY_SPEC, { language: 'en' })
      return fromShopeeCategoryList(res.category_list ?? [])
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawAttributeTreeResponse>(client, ATTRIBUTE_TREE_SPEC, {
        category_id_list: [Number(categoryId)],
        language: 'en',
      })
      const entry = res.list?.at(0)
      if (entry === undefined || entry.attribute_tree === undefined) {
        throw new NotFoundError(`Attribut kategori ${categoryId} tidak ditemukan di Shopee`, {
          platform: 'shopee',
        })
      }
      return fromShopeeAttributeList(entry.attribute_tree)
    } catch (err: unknown) {
      throw mapShopeeError(err, 'shopee')
    }
  }
}
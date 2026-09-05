import {
  NotFoundError,
  type Category,
  type CategoryAttribute,
  type ICategoryProvider,
} from '@opensellpy/core'
import type { ApiCallSpec, TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { callRaw } from '../../client/request.js'
import { mapTiktokError } from '../../errors/tiktok-error.mapper.js'
import {
  fromTiktokAttributeList,
  fromTiktokCategoryList,
  type RawTiktokAttribute,
  type RawTiktokCategory,
} from './category.mapper.js'

const CATEGORY_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/product/202309/categories',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['locale', 'keyword', 'category_version', 'listing_platform', 'include_prohibited_categories', 'shop_cipher'],
  headers: [],
  pathParams: [],
  body: [],
}

const ATTRIBUTE_SPEC: ApiCallSpec = {
  method: 'GET',
  path: '/product/202309/categories/{category_id}/attributes',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  query: ['locale', 'category_version', 'shop_cipher'],
  headers: [],
  pathParams: ['category_id'],
  body: [],
}

interface RawCategoryResponse {
  categories?: RawTiktokCategory[]
}

interface RawAttributeResponse {
  attributes?: RawTiktokAttribute[]
}

/** Category provider TikTok Shop: daftar kategori (tree) + attribute per kategori. */
export class TiktokCategoryProvider implements ICategoryProvider {
  private readonly connector: TikTokShopConnector
  private readonly shopId: string

  constructor(connector: TikTokShopConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawCategoryResponse>(client, CATEGORY_SPEC, { locale: 'id-ID' })
      return fromTiktokCategoryList(res.categories ?? [])
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const client = await this.connector.getClient(this.shopId)
      const res = await callRaw<RawAttributeResponse>(client, ATTRIBUTE_SPEC, {
        category_id: categoryId,
        locale: 'id-ID',
      })
      const attrs = res.attributes
      if (attrs === undefined) {
        throw new NotFoundError(`Attribut kategori ${categoryId} tidak ditemukan di TikTok Shop`, {
          platform: 'tts',
        })
      }
      return fromTiktokAttributeList(attrs)
    } catch (err: unknown) {
      throw mapTiktokError(err, 'tts')
    }
  }
}
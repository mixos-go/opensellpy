import { randomUUID } from 'node:crypto'
import type {
  Category,
  CategoryAttribute,
  ICategoryProvider,
} from '@opensellpy/core'
import type {
  BlibliClient,
  BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliRequestMeta } from '../../config.js'
import { callRaw } from '../../client/request.js'
import { mapBlibliError } from '../../errors/blibli-error.mapper.js'
import { CATEGORY_ATTRIBUTES_V2, CATEGORY_TREE_V1 } from './category.spec.js'
import {
  fromBlibliAttributeList,
  fromBlibliCategoryList,
  type RawBlibliAttribute,
  type RawBlibliCategory,
} from './category.mapper.js'

/**
 * Category provider Blibli. Tree via Category Tree V1 (mtaapi, pakai
 * `businessPartnerCode` bukan storeCode/username); attributes via Category
 * Attributes V2 (kode kategori terdalam/leaf).
 */
export class BlibliCategoryProvider implements ICategoryProvider {
  private readonly connector: BlibliConnector
  private readonly shopId: string
  private readonly meta: BlibliRequestMeta

  constructor(connector: BlibliConnector, shopId: string, meta: BlibliRequestMeta) {
    this.connector = connector
    this.shopId = shopId
    this.meta = meta
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const client = await this.client()
      const content = await callRaw<RawBlibliCategory[]>(
        client,
        CATEGORY_TREE_V1,
        this.params({ businessPartnerCode: this.meta.storeCode }),
      )
      return fromBlibliCategoryList(Array.isArray(content) ? content : [])
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const client = await this.client()
      const content = await callRaw<RawBlibliAttribute[]>(
        client,
        CATEGORY_ATTRIBUTES_V2,
        this.params({ 'category-code': categoryId }),
      )
      return fromBlibliAttributeList(Array.isArray(content) ? content : [])
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
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
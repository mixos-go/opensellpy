import {
  NotFoundError,
  type Category,
  type CategoryAttribute,
  type ICategoryProvider,
} from '@mixos-go/opensellpy-core'
import {
  LazadaProductAPIApi,
  type LazadaClient,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import { callRaw } from '../../client/request.js'
import { mapLazadaError } from '../../errors/lazada-error.mapper.js'
import {
  fromLazadaAttributeList,
  fromLazadaCategoryList,
  type RawLazadaAttribute,
  type RawLazadaCategory,
} from './category.mapper.js'

interface RawCategoryTree {
  category_tree?: RawLazadaCategory[]
}

/** Category provider Lazada: category/tree/get + category/attributes/get. */
export class LazadaCategoryProvider implements ICategoryProvider {
  private readonly connector: LazadaConnector
  private readonly shopId: string

  constructor(connector: LazadaConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const data = await callRaw<RawLazadaCategory[] | RawCategoryTree>(
        api.getCategoryTree({ language_code: 'id' }),
      )
      const list = Array.isArray(data) ? data : data.category_tree ?? []
      return fromLazadaCategoryList(list)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const attrs = await callRaw<RawLazadaAttribute[]>(
        api.getCategoryAttributes({ primary_category_id: categoryId, language_code: 'id' }),
      )
      if (attrs === undefined || attrs.length === 0) {
        throw new NotFoundError(`Attribut kategori ${categoryId} tidak ditemukan di Lazada`, {
          platform: 'lazada',
        })
      }
      return fromLazadaAttributeList(attrs)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  private async client(): Promise<LazadaClient> {
    return this.connector.getClient(this.shopId)
  }
}
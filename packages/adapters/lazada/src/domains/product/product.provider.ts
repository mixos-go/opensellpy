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
import {
  LazadaProductAPIApi,
  type LazadaClient,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import { callRaw } from '../../client/request.js'
import { mapLazadaError } from '../../errors/lazada-error.mapper.js'
import { fromLazadaProduct, type RawLazadaProduct } from './product.mapper.js'
import { toLazadaListProductsParams } from './product.params-mapper.js'

interface RawProductsGet {
  total_products?: number
  products?: Array<{ item_id?: number }>
}

interface RawCreateProduct {
  item_id?: number
}

/**
 * Product provider Lazada: getProducts (list) → getProductItem (detail),
 * create/update + deactivate. Re-activate (status active) tidak didukung via
 * API (tidak ada endpoint activate); batalkan via Seller Center.
 */
export class LazadaProductProvider implements IProductProvider {
  private readonly connector: LazadaConnector
  private readonly shopId: string

  constructor(connector: LazadaConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const raw = await callRaw<RawProductsGet>(api.getProducts(toLazadaListProductsParams(params)))
      const ids = (raw.products ?? [])
        .map((p) => p.item_id)
        .filter((id): id is number => id !== undefined)
      const items: Product[] = []
      for (const id of ids) {
        items.push(await this.getProduct(String(id)))
      }
      return {
        items,
        total: raw.total_products ?? items.length,
        page: params.page,
        limit: params.limit,
        hasNext: items.length >= params.limit,
      }
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const raw = await callRaw<RawLazadaProduct>(api.getProductItem({ item_id: Number(productId) }))
      if (raw.item_id === undefined) {
        throw new NotFoundError(`Produk ${productId} tidak ditemukan di Lazada`, { platform: 'lazada' })
      }
      return fromLazadaProduct(raw)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      if (input.categoryId === undefined) {
        throw new ValidationError('Lazada butuh categoryId untuk menambahkan produk.', { platform: 'lazada' })
      }
      const payload = {
        name: input.name,
        category_id: input.categoryId,
        ...(input.description !== undefined && input.description !== ''
          ? { description: input.description }
          : {}),
        images: { main: input.images.map((u) => ({ url: u })) },
        skus: input.variants.map((v) => ({
          seller_sku: v.sku,
          quantity: 0,
          price: String(v.price.amount),
          package_content: '',
        })),
      }
      const raw = await callRaw<RawCreateProduct>(
        api.createProduct({ payload: JSON.stringify(payload) }),
      )
      if (raw.item_id === undefined) {
        throw new ValidationError('create product Lazada berhasil tanpa item_id.', { platform: 'lazada' })
      }
      return this.getProduct(String(raw.item_id))
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const payload: Record<string, unknown> = { item_id: Number(productId) }
      if (input.name !== undefined) payload['name'] = input.name
      if (input.description !== undefined) payload['description'] = input.description
      if (input.images !== undefined && input.images.length > 0) {
        payload['images'] = { main: input.images.map((u) => ({ url: u })) }
      }
      await callRaw<Record<string, unknown>>(api.updateProduct({ payload: JSON.stringify(payload) }))
      if (input.status === 'inactive') {
        await callRaw<Record<string, unknown>>(
          api.deactivateProduct({ apiRequestBody: JSON.stringify({ ItemId: Number(productId) }) }),
        )
      } else if (input.status === 'active') {
        throw new ValidationError(
          'Lazada tidak punya endpoint activate; aktifkan ulang lewat Seller Center.',
          { platform: 'lazada' },
        )
      }
      return this.getProduct(productId)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  private async client(): Promise<LazadaClient> {
    return this.connector.getClient(this.shopId)
  }
}
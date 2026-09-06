import { randomUUID } from 'node:crypto'
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
import type {
  BlibliClient,
  BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliRequestMeta } from '../../config.js'
import { callEnvelope, callRaw } from '../../client/request.js'
import { mapBlibliError } from '../../errors/blibli-error.mapper.js'
import { fromBlibliProduct, type RawBlibliProduct } from './product.mapper.js'
import { toBlibliListProductsBody } from './product.params-mapper.js'
import {
  ARCHIVE_PRODUCT_V2,
  CREATE_PRODUCT_V3,
  PRODUCT_LIST_V3,
  UNARCHIVE_PRODUCT_V2,
  UPDATE_PRODUCT_DETAIL_V2,
} from './product.spec.js'

interface RawProductListEnvelope {
  content?: RawBlibliProduct[]
  paging?: { pageNumber?: number; pageSize?: number; totalPage?: number; totalRecord?: number }
}

function imageMapFor(images: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {}
  images.forEach((url, i) => {
    map[`image-${i + 1}`] = url
  })
  return map
}

function imageKeysFor(images: readonly string[]): string[] {
  return images.map((_, i) => `image-${i + 1}`)
}

/**
 * Product provider Blibli. Product domain = product L3 (`productSku`/
 * `merchantSku`). `createProduct` → Create Product V3 (queue async, 202);
 * update name/description via Update Product Detail V2; status via
 * archive/unarchive V2. Gambar/ubah kategori tidak didukung (ValidationError).
 */
export class BlibliProductProvider implements IProductProvider {
  private readonly connector: BlibliConnector
  private readonly shopId: string
  private readonly meta: BlibliRequestMeta

  constructor(connector: BlibliConnector, shopId: string, meta: BlibliRequestMeta) {
    this.connector = connector
    this.shopId = shopId
    this.meta = meta
  }

  async listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    try {
      const client = await this.client()
      const env = await callEnvelope(client, PRODUCT_LIST_V3, this.params(toBlibliListProductsBody(params)))
      const raw = env as RawProductListEnvelope
      const items = (raw.content ?? []).map(fromBlibliProduct)
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

  async getProduct(productId: string): Promise<Product> {
    try {
      const client = await this.client()
      const env = await callEnvelope(client, PRODUCT_LIST_V3, this.params({
        filter: { productSku: productId },
        paging: { page: 0, size: 1 },
        sorting: { by: 'createdDate', direction: 'DESC' },
      }))
      const raw = env as RawProductListEnvelope
      const found = (raw.content ?? []).at(0)
      if (found === undefined) {
        throw new NotFoundError(`Produk ${productId} tidak ditemukan di Blibli`, {
          platform: 'blibli',
        })
      }
      return fromBlibliProduct(found)
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const client = await this.client()
      const baseVariant = input.variants.at(0)
      if (baseVariant === undefined) {
        throw new ValidationError('Blibli butuh minimal satu variant (sellerSku + harga).', {
          platform: 'blibli',
        })
      }
      if (input.categoryId === undefined) {
        throw new ValidationError('Blibli butuh categoryId (kode kategori L4) untuk produk baru.', {
          platform: 'blibli',
        })
      }
      const imageKeys = imageKeysFor(input.images)
      const body = {
        product: [
          {
            name: input.name,
            ...(input.description !== undefined && input.description !== ''
              ? { description: input.description }
              : {}),
            categoryCode: input.categoryId,
            productType: 1,
            attributes: baseVariant.attributes,
            productItems: input.variants.map((v) => ({
              sellerSku: v.sku,
              name: v.name,
              price: v.price.amount,
              stock: 0,
              minimumStock: 0,
              buyable: true,
              images: imageKeys,
            })),
            images: imageKeys,
            imageMap: imageMapFor(input.images),
          },
        ],
      }
      await callRaw<unknown>(client, CREATE_PRODUCT_V3, this.params({ product: body.product }))
      return {
        id: baseVariant.sku,
        platformProductId: baseVariant.sku,
        name: input.name,
        images: input.images,
        status: 'draft',
        variants: input.variants,
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        raw: body,
      }
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    try {
      const client = await this.client()
      if (input.categoryId !== undefined) {
        throw new ValidationError(
          'Blibli tidak mendukung ubah kategori via API — ubah lewat Seller Center.',
          { platform: 'blibli' },
        )
      }
      if (input.images !== undefined) {
        throw new ValidationError(
          'Blibli kelola gambar per blibliSku (Add Image V1); gunakan Seller Center atau update per variant.',
          { platform: 'blibli' },
        )
      }
      const detail: Record<string, unknown> = {}
      if (input.name !== undefined) detail['name'] = input.name
      if (input.description !== undefined) detail['description'] = input.description
      if (Object.keys(detail).length > 0) {
        await callRaw<unknown>(
          client,
          UPDATE_PRODUCT_DETAIL_V2,
          this.params({ 'product-sku': productId, ...detail }),
        )
      }
      if (input.status === 'inactive') {
        await callRaw<unknown>(client, ARCHIVE_PRODUCT_V2, this.params({}))
      } else if (input.status === 'active') {
        await callRaw<unknown>(client, UNARCHIVE_PRODUCT_V2, this.params({}))
      } else if (input.status === 'draft') {
        throw new ValidationError('Blibli tidak punya state draft — status di-set di Seller Center.', {
          platform: 'blibli',
        })
      }
      return this.getProduct(productId)
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
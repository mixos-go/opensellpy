import { NotFoundError, ValidationError } from '@mixos-go/opensellpy-core'
import type {
  CreateProductInput,
  IProductProvider,
  ListProductsParams,
  PaginatedResult,
  Product,
  ProductStatus,
  UpdateProductInput,
} from '@mixos-go/opensellpy-core'
import type { MockBackend } from './mock-backend.js'

const PRODUCT_STATUSES: readonly ProductStatus[] = ['active', 'inactive', 'draft']

export class MockProductProvider implements IProductProvider {
  constructor(private readonly backend: MockBackend) {}

  async listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    const filtered = this.backend.products.filter((product) =>
      params.status === undefined ? true : product.status === params.status,
    )
    const start = (params.page - 1) * params.limit
    const items = filtered.slice(start, start + params.limit).map((product) => structuredClone(product))
    return {
      items,
      total: filtered.length,
      page: params.page,
      limit: params.limit,
      hasNext: start + params.limit < filtered.length,
    }
  }

  async getProduct(productId: string): Promise<Product> {
    return structuredClone(this.find(productId))
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const id = this.backend.nextProductId()
    const product: Product = {
      id,
      platformProductId: id,
      name: input.name,
      images: structuredClone(input.images),
      status: 'active',
      variants: structuredClone(input.variants),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      raw: { source: 'mock', created: true },
    }
    this.backend.products.push(product)
    return structuredClone(product)
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    const product = this.find(productId)
    if (input.status !== undefined && !PRODUCT_STATUSES.includes(input.status)) {
      throw new ValidationError(`Status produk ${input.status} tidak dikenal`, {
        platform: this.backend.platform,
      })
    }
    if (input.name !== undefined) {
      product.name = input.name
    }
    if (input.description !== undefined) {
      product.description = input.description
    }
    if (input.images !== undefined) {
      product.images = structuredClone(input.images)
    }
    if (input.categoryId !== undefined) {
      product.categoryId = input.categoryId
    }
    if (input.status !== undefined) {
      product.status = input.status
    }
    product.raw = { ...(product.raw as Record<string, unknown>), updated: true }
    return structuredClone(product)
  }

  private find(productId: string): Product {
    const product = this.backend.products.find(
      (candidate) => candidate.id === productId || candidate.platformProductId === productId,
    )
    if (product === undefined) {
      throw new NotFoundError(`Produk ${productId} tidak ditemukan`, { platform: this.backend.platform })
    }
    return product
  }
}
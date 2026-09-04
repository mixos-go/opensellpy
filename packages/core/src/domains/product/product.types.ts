import type { Money } from '../../shared/money.js'
import type { PaginationParams } from '../../shared/pagination.js'

export type ProductStatus = 'active' | 'inactive' | 'draft'

export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: Money
  attributes: Record<string, string>
}

export interface Product {
  id: string
  platformProductId: string
  name: string
  description?: string
  images: string[]
  status: ProductStatus
  variants: ProductVariant[]
  categoryId?: string
  raw: unknown
}

export interface ListProductsParams extends PaginationParams {
  status?: ProductStatus
}

export interface CreateProductInput {
  name: string
  description?: string
  images: string[]
  variants: ProductVariant[]
  categoryId?: string
}

export interface UpdateProductInput {
  name?: string
  description?: string
  images?: string[]
  status?: ProductStatus
  categoryId?: string
}

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
  /** Epoch detik — window berdasarkan last-updated (per platform). Opsional; tanpa nilai, platform mengambil semua item tanpa window waktu. */
  updatedFrom?: number
  /** Epoch detik — batas atas window last-updated. Opsional; diperkenankan hanya bila platform mendukung (Lazada product: tidak mendukung `to`, diabaikan). */
  updatedTo?: number
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

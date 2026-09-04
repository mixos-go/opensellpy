import type {
  CreateProductInput,
  ListProductsParams,
  Product,
  UpdateProductInput,
} from './product.types.js'
import type { PaginatedResult } from '../../shared/pagination.js'

export interface IProductProvider {
  listProducts(params: ListProductsParams): Promise<PaginatedResult<Product>>
  getProduct(productId: string): Promise<Product>
  createProduct(input: CreateProductInput): Promise<Product>
  updateProduct(productId: string, input: UpdateProductInput): Promise<Product>
}

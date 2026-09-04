import type { Category, CategoryAttribute } from './category.types.js'

export interface ICategoryProvider {
  getCategoryTree(): Promise<Category[]>
  getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]>
}

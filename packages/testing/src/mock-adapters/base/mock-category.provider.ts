import { NotFoundError } from '@mixos-go/opensellpy-core'
import type { Category, CategoryAttribute, ICategoryProvider } from '@mixos-go/opensellpy-core'
import type { MockBackend } from './mock-backend.js'

function flattenCategories(categories: Category[], acc: Category[] = []): Category[] {
  for (const category of categories) {
    acc.push(category)
    if (category.children.length > 0) {
      flattenCategories(category.children, acc)
    }
  }
  return acc
}

export class MockCategoryProvider implements ICategoryProvider {
  constructor(private readonly backend: MockBackend) {}

  async getCategoryTree(): Promise<Category[]> {
    return structuredClone(this.backend.categories)
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    const found = flattenCategories(this.backend.categories).some((category) => category.id === categoryId)
    if (!found) {
      throw new NotFoundError(`Kategori ${categoryId} tidak ditemukan`, { platform: this.backend.platform })
    }
    return structuredClone(this.backend.attributes[categoryId] ?? [])
  }
}
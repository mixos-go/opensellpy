export interface Category {
  id: string
  platformCategoryId: string
  name: string
  parentId?: string
  children: Category[]
  raw: unknown
}

export interface CategoryAttribute {
  id: string
  name: string
  required: boolean
}

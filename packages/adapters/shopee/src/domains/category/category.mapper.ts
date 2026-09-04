import type { Category, CategoryAttribute } from '@opensellpy/core'

/** Bentuk minimal raw kategori dari get_category (Shopee). */
export interface RawCategory {
  category_id?: number
  parent_category_id?: number
  original_category_name?: string
  display_category_name?: string
  has_children?: boolean
}

/** Bentuk minimal raw attribute dari get_attribute_tree (Shopee). */
export interface RawAttribute {
  attribute_id?: number
  name?: string
  mandatory?: boolean
}

const ROOT_PARENT_ID = 0

/**
 * Pertahankan urutan flat API + bangun pohon children per parent.
 * Kategori tanpa parent (parent_category_id=0) = root.
 */
export function fromShopeeCategoryList(rawList: RawCategory[]): Category[] {
  const byId = new Map<string, { node: Category; raw: RawCategory }>()
  for (const raw of rawList) {
    if (raw.category_id === undefined) continue
    const id = String(raw.category_id)
    const node: Category = {
      id,
      platformCategoryId: id,
      name: raw.display_category_name ?? raw.original_category_name ?? '',
      children: [],
      raw,
    }
    byId.set(id, { node, raw })
  }
  const roots: Category[] = []
  for (const { node, raw } of byId.values()) {
    if (raw.parent_category_id === undefined || raw.parent_category_id === ROOT_PARENT_ID) {
      roots.push(node)
      continue
    }
    const parentId = String(raw.parent_category_id)
    const parent = byId.get(parentId)
    if (parent !== undefined) parent.node.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** Map attribute tree Shopee → CategoryAttribute domain. */
export function fromShopeeAttributeList(rawList: RawAttribute[]): CategoryAttribute[] {
  return rawList.map((raw) => ({
    id: raw.attribute_id === undefined ? '' : String(raw.attribute_id),
    name: raw.name ?? '',
    required: raw.mandatory === true,
  }))
}
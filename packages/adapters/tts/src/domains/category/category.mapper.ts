import type { Category, CategoryAttribute } from '@mixos-go/opensellpy-core'

/** Bentuk minimal raw kategori dari product categories (TikTok Shop). */
export interface RawTiktokCategory {
  id?: string
  parent_id?: string
  name?: string
}

/** Bentuk minimal raw attribute dari category attributes (TikTok Shop). */
export interface RawTiktokAttribute {
  id?: string
  name?: string
  is_required?: boolean
}

const ROOT_PARENT = '0'

/**
 * Pertahankan urutan flat API + bangun pohon children per parent.
 * Kategori tanpa parent (parent_id kosong/'0') = root.
 */
export function fromTiktokCategoryList(rawList: RawTiktokCategory[]): Category[] {
  const byId = new Map<string, { node: Category; parentId: string | undefined }>()
  for (const raw of rawList) {
    if (raw.id === undefined) continue
    const node: Category = {
      id: raw.id,
      platformCategoryId: raw.id,
      name: raw.name ?? '',
      children: [],
      raw,
    }
    byId.set(raw.id, { node, parentId: raw.parent_id })
  }
  const roots: Category[] = []
  for (const item of byId.values()) {
    const parentId = item.parentId
    if (parentId === undefined || parentId === '' || parentId === ROOT_PARENT) {
      roots.push(item.node)
      continue
    }
    const parent = byId.get(parentId)
    if (parent !== undefined) parent.node.children.push(item.node)
    else roots.push(item.node)
  }
  return roots
}

/** Map attribute TikTok → CategoryAttribute domain. */
export function fromTiktokAttributeList(rawList: RawTiktokAttribute[]): CategoryAttribute[] {
  return rawList.map((raw) => ({
    id: raw.id ?? '',
    name: raw.name ?? '',
    required: raw.is_required === true,
  }))
}
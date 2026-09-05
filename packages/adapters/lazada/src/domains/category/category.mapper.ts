import type { Category, CategoryAttribute } from '@opensellpy/core'

/** Bentuk minimal raw kategori dari category/tree/get (Lazada, sudah nested). */
export interface RawLazadaCategory {
  category_id?: number | string
  name?: string
  children?: RawLazadaCategory[]
}

/** Bentuk minimal raw attribute dari category/attributes/get (Lazada). */
export interface RawLazadaAttribute {
  id?: number
  name?: string
  label?: string
  is_mandatory?: number
}

/** Map satu node raw kategori (recursive) → Category domain. */
export function fromLazadaCategory(raw: RawLazadaCategory): Category {
  const id = String(raw.category_id ?? '')
  return {
    id,
    platformCategoryId: id,
    name: raw.name ?? '',
    children: (raw.children ?? []).map(fromLazadaCategory),
    raw,
  }
}

/** Map raw kategori tree Lazada → Category[] domain. */
export function fromLazadaCategoryList(rawList: RawLazadaCategory[]): Category[] {
  return rawList.map(fromLazadaCategory)
}

/** Map attribute Lazada → CategoryAttribute domain. */
export function fromLazadaAttributeList(rawList: RawLazadaAttribute[]): CategoryAttribute[] {
  return rawList.map((raw) => ({
    id: String(raw.id ?? raw.name ?? ''),
    name: raw.label ?? raw.name ?? '',
    required: raw.is_mandatory === 1,
  }))
}
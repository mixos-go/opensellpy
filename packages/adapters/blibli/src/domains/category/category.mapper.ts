import type { Category, CategoryAttribute } from '@mixos-go/opensellpy-core'

/** Node tree kategori Blibli (recursive). */
export interface RawBlibliCategory {
  code?: string
  name?: string
  nameLocale?: { ID?: string; EN?: string }
  children?: RawBlibliCategory[]
}

/** Attribute kategori Blibli (Category Attributes V2). */
export interface RawBlibliAttribute {
  code?: string
  name?: string
  nameLocale?: { ID?: string; EN?: string }
  mandatory?: boolean
  type?: string
  variantCreating?: boolean
  specialAttribute?: boolean
  options?: string[]
}

function categoryName(raw: RawBlibliCategory): string {
  return raw.name ?? raw.nameLocale?.ID ?? raw.nameLocale?.EN ?? ''
}

function attributeName(raw: RawBlibliAttribute): string {
  return raw.name ?? raw.nameLocale?.ID ?? raw.nameLocale?.EN ?? ''
}

/** Map satu node kategori (recursive) → Category domain. */
export function fromBlibliCategory(raw: RawBlibliCategory): Category {
  const id = raw.code ?? ''
  return {
    id,
    platformCategoryId: id,
    name: categoryName(raw),
    children: (raw.children ?? []).map(fromBlibliCategory),
    raw,
  }
}

/** Map daftar root kategori → Category[] domain. */
export function fromBlibliCategoryList(rawList: RawBlibliCategory[]): Category[] {
  return rawList.map(fromBlibliCategory)
}

/** Map attribute kategori → CategoryAttribute domain. */
export function fromBlibliAttributeList(rawList: RawBlibliAttribute[]): CategoryAttribute[] {
  return rawList.map((raw) => ({
    id: raw.code ?? '',
    name: attributeName(raw),
    required: raw.mandatory === true,
  }))
}
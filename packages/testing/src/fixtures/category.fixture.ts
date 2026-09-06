import type { Category, CategoryAttribute } from '@mixos-go/opensellpy-core'

export function buildCategory(overrides?: Partial<Category>): Category {
  const base: Category = {
    id: 'CAT-1',
    platformCategoryId: 'PLAT-CAT-1',
    name: 'Fashion',
    children: [],
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as Category
}

export function buildCategoryTree(): Category[] {
  const kaos = buildCategory({
    id: 'CAT-2',
    platformCategoryId: 'PLAT-CAT-2',
    name: 'Kaos',
  })
  const celana = buildCategory({
    id: 'CAT-3',
    platformCategoryId: 'PLAT-CAT-3',
    name: 'Celana',
  })
  return [
    buildCategory({
      id: 'CAT-1',
      platformCategoryId: 'PLAT-CAT-1',
      name: 'Fashion',
      children: [kaos, celana],
    }),
    buildCategory({
      id: 'CAT-4',
      platformCategoryId: 'PLAT-CAT-4',
      name: 'Elektronik',
      children: [
        buildCategory({
          id: 'CAT-5',
          platformCategoryId: 'PLAT-CAT-5',
          name: 'Smartphone',
        }),
      ],
    }),
  ]
}

export function buildCategoryAttribute(overrides?: Partial<CategoryAttribute>): CategoryAttribute {
  const base: CategoryAttribute = {
    id: 'ATTR-1',
    name: 'Warna',
    required: false,
  }
  return { ...base, ...overrides } as CategoryAttribute
}

export function buildCategoryAttributeList(count: number): CategoryAttribute[] {
  const attributes: CategoryAttribute[] = []
  for (let i = 1; i <= count; i += 1) {
    attributes.push(
      buildCategoryAttribute({
        id: `ATTR-${i}`,
        name: `Atribut ${i}`,
        required: i % 2 === 0,
      }),
    )
  }
  return attributes
}
import type { Product, ProductVariant } from '@opensellpy/core'

export function buildProductVariant(overrides?: Partial<ProductVariant>): ProductVariant {
  const base: ProductVariant = {
    id: 'VAR-1',
    sku: 'SKU-1',
    name: 'Produk Contoh Varian',
    price: { amount: 100000, currency: 'IDR' },
    attributes: { color: 'Hitam' },
  }
  return { ...base, ...overrides } as ProductVariant
}

export function buildProduct(overrides?: Partial<Product>): Product {
  const base: Product = {
    id: 'PRD-1',
    platformProductId: 'PLAT-PRD-1',
    name: 'Produk Contoh',
    description: 'Deskripsi produk contoh',
    images: ['https://cdn.example.com/1.jpg'],
    status: 'active',
    variants: [buildProductVariant()],
    categoryId: 'CAT-1',
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as Product
}

export function buildProductList(count: number, overrides?: Partial<Product>): Product[] {
  const products: Product[] = []
  for (let i = 1; i <= count; i += 1) {
    products.push(
      buildProduct({
        id: `PRD-${i}`,
        platformProductId: `PLAT-PRD-${i}`,
        name: `Produk Contoh ${i}`,
        variants: [buildProductVariant({ id: `VAR-${i}`, sku: `SKU-${i}` })],
        ...overrides,
      }),
    )
  }
  return products
}
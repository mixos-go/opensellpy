import type { Money, Product, ProductVariant } from '@opensellpy/core'
import { fromBlibliProductState } from './product.status-map.js'

/** Content Product List V3 (satu baris per product L3). */
export interface RawBlibliProduct {
  brand?: { name?: string }
  category?: { code?: string; name?: string }
  flags?: Record<string, boolean | undefined>
  images?: Array<{ main?: boolean; path?: string; sequence?: number }>
  pickupPointCodes?: string[]
  product?: { code?: string; name?: string; sku?: string; url?: { blibli?: string }; state?: string }
  counter?: { stock?: number; variant?: number }
  price?: { normal?: { min?: number; max?: number }; sale?: { min?: number; max?: number } }
  createdDate?: number
  updatedDate?: number
}

function moneyFrom(amount: number | undefined): Money {
  const value = amount ?? 0
  return { amount: Number.isFinite(value) ? value : 0, currency: 'IDR' }
}

/**
 * Map satu content Product List V3 → Product domain.
 *
 * Blibli tidak menyediakan listing variant (L4) di list/detail — harga list
 * adalah range `price.normal.{min,max}`. Karena itu dipetakan SEDIKIT variant
 * sintetis (sku = productSku L3, harga = `price.normal.min`).
 */
export function fromBlibliProduct(raw: RawBlibliProduct): Product {
  const product = raw.product ?? {}
  const sku = product.sku ?? ''
  const price = moneyFrom(raw.price?.normal?.min)
  const variant: ProductVariant = {
    id: sku,
    sku,
    name: product.name ?? '',
    price,
    attributes: {},
  }
  return {
    id: sku,
    platformProductId: sku,
    name: product.name ?? '',
    images: (raw.images ?? []).map((i) => i.path ?? ''),
    status: fromBlibliProductState(product.state),
    variants: sku === '' ? [] : [variant],
    ...(raw.category?.code !== undefined && raw.category.code !== '' ? { categoryId: raw.category.code } : {}),
    raw,
  }
}
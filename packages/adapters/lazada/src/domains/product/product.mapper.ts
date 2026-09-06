import type { Money, Product, ProductVariant } from '@mixos-go/opensellpy-core'
import { fromLazadaProductStatus } from './product.status-map.js'

/** Bentuk minimal raw product dari product/get (Lazada). */
export interface RawLazadaProduct {
  item_id?: number
  status?: string
  subStatus?: string
  primary_category?: number
  images?: string
  created_time?: string
  updated_time?: string
  skus?: RawLazadaSku[]
}

export interface RawLazadaSku {
  sku_id?: number
  seller_sku?: string
  shop_sku?: string
  quantity?: number
  price?: string | RawLazadaPrice
  status?: string
  package_content?: string
}

export interface RawLazadaPrice {
  currency?: string
  amount?: string
  original_amount?: string
  special_amount?: string
  currency_code?: string
}

function parseImages(raw: string | undefined): string[] {
  if (raw === undefined || raw === '') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const urls = parsed.map((u: unknown) => (typeof u === 'string' ? u : '')).filter(Boolean)
      return urls.length > 0 ? urls : []
    }
    if (typeof parsed === 'string' && parsed !== '') return [parsed]
    return []
  } catch {
    return [raw]
  }
}

function moneyFrom(raw: RawLazadaSku): Money {
  const price = raw.price
  if (typeof price === 'string') {
    const value = Number(price)
    return { amount: Number.isFinite(value) ? value : 0, currency: '' }
  }
  const amount = Number(price?.amount ?? price?.special_amount ?? 0)
  return { amount: Number.isFinite(amount) ? amount : 0, currency: price?.currency ?? price?.currency_code ?? '' }
}

function mapSku(raw: RawLazadaSku, fallbackName: string): ProductVariant {
  return {
    id: String(raw.sku_id ?? ''),
    sku: raw.seller_sku ?? raw.shop_sku ?? '',
    name: fallbackName,
    price: moneyFrom(raw),
    attributes: {},
  }
}

/** Map satu raw product Lazada → Product domain opensellpy. */
export function fromLazadaProduct(raw: RawLazadaProduct): Product {
  const id = String(raw.item_id ?? '')
  return {
    id,
    platformProductId: id,
    name: '',
    images: parseImages(raw.images),
    status: fromLazadaProductStatus(raw.status),
    variants: (raw.skus ?? []).map((sku) => mapSku(sku, '')),
    ...(raw.primary_category !== undefined ? { categoryId: String(raw.primary_category) } : {}),
    ...(raw.created_time !== undefined ? { createdAt: toIso(raw.created_time) } : {}),
    ...(raw.updated_time !== undefined ? { updatedAt: toIso(raw.updated_time) } : {}),
    raw,
  }
}

function toIso(raw: string | undefined): string {
  if (raw === undefined || raw === '') return new Date(0).toISOString()
  const t = Date.parse(raw)
  return Number.isNaN(t) ? new Date(0).toISOString() : new Date(t).toISOString()
}
import type { Money, Product, ProductVariant } from '@mixos-go/opensellpy-core'
import { fromTiktokProductStatus } from './product.status-map.js'

/** Bentuk minimal raw product dari product detail/search (TikTok Shop). */
export interface RawTiktokProduct {
  id?: string
  title?: string
  description?: string
  product_status?: string
  status?: string
  category_id?: string
  create_time?: number
  update_time?: number
  main_images?: Array<{
    uri?: string
    urls?: string[]
    height?: number
    width?: number
  }>
  skus?: RawTiktokSku[]
}

export interface RawTiktokSku {
  id?: string
  seller_sku?: string
  quantity?: number
  price?: {
    sale_price?: string
    currency?: string
  }
}

function moneyFrom(salePrice: string | undefined, currency: string | undefined): Money {
  const amount = Number(salePrice)
  return { amount: Number.isFinite(amount) ? amount : 0, currency: currency ?? '' }
}

function imageUrls(images: RawTiktokProduct['main_images'] | undefined): string[] {
  const urls: string[] = []
  for (const img of images ?? []) {
    const take = img.urls?.at(0) ?? img.uri
    if (take !== undefined && take !== '') urls.push(take)
  }
  return urls
}

function mapSku(raw: RawTiktokSku, fallbackName: string, fallbackCurrency: string | undefined): ProductVariant {
  return {
    id: raw.id ?? '',
    sku: raw.seller_sku ?? '',
    name: fallbackName,
    price: moneyFrom(raw.price?.sale_price, raw.price?.currency ?? fallbackCurrency),
    attributes: {},
  }
}

/** Map satu raw product TikTok → Product domain opensellpy. */
export function fromTiktokProduct(raw: RawTiktokProduct): Product {
  const id = raw.id ?? ''
  const currency = raw.skus?.at(0)?.price?.currency
  return {
    id,
    platformProductId: id,
    name: raw.title ?? '',
    ...(raw.description !== undefined && raw.description !== ''
      ? { description: raw.description }
      : {}),
    images: imageUrls(raw.main_images),
    status: fromTiktokProductStatus(raw.product_status ?? raw.status),
    variants: (raw.skus ?? []).map((sku) => mapSku(sku, raw.title ?? '', currency)),
    ...(raw.category_id !== undefined ? { categoryId: raw.category_id } : {}),
    raw,
  }
}
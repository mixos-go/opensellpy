import type { Money, Product, ProductVariant } from '@mixos-go/opensellpy-core'
import { fromShopeeItemStatus } from './product.status-map.js'

/** Bentuk minimal raw product dari get_item_base_info (Shopee). */
export interface RawItemBaseInfo {
  item_id?: number
  item_name?: string
  description?: string
  item_sku?: string
  category_id?: number
  item_status?: string
  update_time?: number
  image?: {
    image_url_list?: string[]
    image_id_list?: string[]
  } | null
  price_info?: Array<{
    currency?: string
    original_price?: number
  }>
  stock_info_v2?: {
    summary_info?: {
      total_available_stock?: number
    }
    seller_stock?: Array<{
      location_id?: string
      stock?: number
    }>
  }
  has_model?: boolean
}

function buildVariant(item: RawItemBaseInfo): ProductVariant {
  const priceRaw = item.price_info?.at(0)
  const price: Money = {
    amount: priceRaw?.original_price ?? 0,
    currency: priceRaw?.currency ?? '',
  }
  return {
    id: item.item_id === undefined ? '' : String(item.item_id),
    sku: item.item_sku ?? '',
    name: item.item_name ?? '',
    price,
    attributes: {},
  }
}

/**
 * Map raw item base info Shopee → Product domain opensellpy.
 *
 * Catatan: cart tanpa tier variation di-representasikan sebagai satu variant
 * (id = item_id). Item ber-model (`has_model`) hanya membawa harga/stok базbase
 * dari get_item_base_info.
 */
export function fromShopeeItemBaseInfo(item: RawItemBaseInfo): Product {
  const id = item.item_id === undefined ? '' : String(item.item_id)
  return {
    id,
    platformProductId: id,
    name: item.item_name ?? '',
    ...(item.description !== undefined && item.description !== ''
      ? { description: item.description }
      : {}),
    images: item.image?.image_url_list ?? [],
    status: fromShopeeItemStatus(item.item_status),
    variants: [buildVariant(item)],
    ...(item.category_id !== undefined ? { categoryId: String(item.category_id) } : {}),
    raw: item,
  }
}
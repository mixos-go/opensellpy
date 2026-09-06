import type { StockLevel } from '@mixos-go/opensellpy-core'

export interface RawTiktokSkuStock {
  id?: string
  seller_sku?: string
  quantity?: number
  price?: {
    sale_price?: string
    currency?: string
  }
}

/** Map raw SKU TikTok → StockLevel domain. */
export function fromTiktokStockLevel(
  sku: string,
  product: { update_time?: number },
  rawSku: RawTiktokSkuStock,
): StockLevel {
  const quantity = rawSku.quantity ?? 0
  const updatedAt =
    product.update_time === undefined
      ? new Date(0).toISOString()
      : new Date(product.update_time * 1000).toISOString()
  return {
    sku,
    quantity,
    updatedAt,
    raw: rawSku,
  }
}
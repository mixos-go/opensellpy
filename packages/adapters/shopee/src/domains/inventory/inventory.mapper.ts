import type { StockLevel } from '@mixos-go/opensellpy-core'

export interface RawInventoryItem {
  item_id?: number
  item_sku?: string
  update_time?: number
  stock_info_v2?: {
    summary_info?: {
      total_available_stock?: number
    }
    seller_stock?: Array<{
      location_id?: string
      stock?: number
    }>
  }
}

/** Map raw item base info → StockLevel domain. */
export function fromShopeeStockLevel(sku: string, raw: RawInventoryItem): StockLevel {
  const stock = raw.stock_info_v2
  const sellerStock = stock?.seller_stock?.at(0)
  const quantity = stock?.summary_info?.total_available_stock ?? 0
  const updatedAt =
    raw.update_time === undefined ? new Date(0).toISOString() : new Date(raw.update_time * 1000).toISOString()
  return {
    sku,
    quantity,
    ...(sellerStock?.location_id !== undefined ? { warehouseId: sellerStock.location_id } : {}),
    updatedAt,
    raw,
  }
}
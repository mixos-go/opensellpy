import type { UpdateStockInput } from '@mixos-go/opensellpy-core'

/**
 * Body update_stock Shopee: stok item-level dicoret saat `model_id` di-omit.
 * `location_id` opsional — di-include hanya bila warehouseId diberikan.
 */
export function toShopeeUpdateStockBody(itemId: number, input: UpdateStockInput): Record<string, unknown> {
  const sellerStock: Record<string, unknown> = { stock: input.quantity }
  if (input.warehouseId !== undefined) sellerStock['location_id'] = input.warehouseId
  return {
    item_id: itemId,
    stock_list: [{ seller_stock: [sellerStock] }],
  }
}
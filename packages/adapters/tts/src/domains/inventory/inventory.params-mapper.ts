/**
 * Body update inventory TikTok (`/product/202309/products/{product_id}/inventory/update`):
 * `skus: [{ id, inventory: [{ warehouse_id, quantity }] }]` — stok di-set per warehouse
 * (absolut). Wajib ada blok `inventory`; tanpanya API menolak ("Inventory of Skus[0]...").
 */
export function toTiktokUpdateInventoryBody(
  skuId: string,
  warehouseId: string,
  quantity: number,
): Record<string, unknown> {
  return {
    skus: [{ id: skuId, inventory: [{ warehouse_id: warehouseId, quantity }] }],
  }
}
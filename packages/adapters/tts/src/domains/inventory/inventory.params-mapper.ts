/**
 * Body update inventory TikTok: `skus: [{ id: sku_id, stock }]`.
 * Stok TikTok bersifat SKU-level (agregat lintas lokasi); tidak ada
 * per-warehouse di flow ini.
 */
export function toTiktokUpdateInventoryBody(skuId: string, quantity: number): Record<string, unknown> {
  return {
    skus: [{ id: skuId, stock: quantity }],
  }
}
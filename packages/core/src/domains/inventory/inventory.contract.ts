import type { StockLevel, UpdateStockInput, Warehouse } from './inventory.types.js'

export interface IInventoryProvider {
  listWarehouses(): Promise<Warehouse[]>
  getStock(sku: string): Promise<StockLevel>
  updateStock(input: UpdateStockInput): Promise<StockLevel>
}

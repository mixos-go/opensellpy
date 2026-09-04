export interface Warehouse {
  id: string
  name: string
  address?: string
  raw: unknown
}

export interface StockLevel {
  sku: string
  quantity: number
  warehouseId?: string
  updatedAt: string
  raw: unknown
}

export interface UpdateStockInput {
  sku: string
  quantity: number
  warehouseId?: string
}

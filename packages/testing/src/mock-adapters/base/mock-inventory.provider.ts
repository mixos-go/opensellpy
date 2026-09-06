import { NotFoundError } from '@opensellpy/core'
import type { IInventoryProvider, StockLevel, UpdateStockInput, Warehouse } from '@opensellpy/core'
import type { MockBackend } from './mock-backend.js'

export class MockInventoryProvider implements IInventoryProvider {
  constructor(private readonly backend: MockBackend) {}

  async listWarehouses(): Promise<Warehouse[]> {
    return structuredClone(this.backend.warehouses)
  }

  async getStock(sku: string): Promise<StockLevel> {
    const stock = this.backend.stock.get(sku)
    if (stock === undefined) {
      throw new NotFoundError(`Stok untuk SKU ${sku} tidak ditemukan`, { platform: this.backend.platform })
    }
    return structuredClone(stock)
  }

  async updateStock(input: UpdateStockInput): Promise<StockLevel> {
    const existing = this.backend.stock.get(input.sku)
    const warehouseId = input.warehouseId ?? existing?.warehouseId
    const stock: StockLevel = {
      sku: input.sku,
      quantity: input.quantity,
      updatedAt: new Date().toISOString(),
      ...(warehouseId === undefined ? {} : { warehouseId }),
      raw: { source: 'mock' },
    }
    this.backend.stock.set(input.sku, stock)
    return structuredClone(stock)
  }
}
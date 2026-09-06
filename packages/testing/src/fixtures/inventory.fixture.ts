import type { StockLevel, Warehouse } from '@opensellpy/core'

export function buildWarehouse(overrides?: Partial<Warehouse>): Warehouse {
  const base: Warehouse = {
    id: 'WH-1',
    name: 'Gudang Utama',
    address: 'Jl. Industri No. 2',
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as Warehouse
}

export function buildStockLevel(overrides?: Partial<StockLevel>): StockLevel {
  const base: StockLevel = {
    sku: 'SKU-1',
    quantity: 100,
    updatedAt: '2024-01-10T08:00:00.000Z',
    raw: { source: 'fixture' },
  }
  return { ...base, ...overrides } as StockLevel
}
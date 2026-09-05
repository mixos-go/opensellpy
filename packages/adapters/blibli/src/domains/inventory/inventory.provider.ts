import { randomUUID } from 'node:crypto'
import {
  NotFoundError,
  ValidationError,
  type IInventoryProvider,
  type StockLevel,
  type UpdateStockInput,
  type Warehouse,
} from '@opensellpy/core'
import type {
  BlibliClient,
  BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliRequestMeta } from '../../config.js'
import { callEnvelope, callRaw } from '../../client/request.js'
import { mapBlibliError } from '../../errors/blibli-error.mapper.js'
import { PRODUCT_LIST_V3 } from '../product/product.spec.js'
import type { RawBlibliProduct } from '../product/product.mapper.js'
import {
  PICKUP_POINT_LIST_V2,
  PRODUCT_VARIANT_FILTER_V1,
  UPDATE_PRODUCT_STOCK_V1,
} from './inventory.spec.js'

interface RawStockEnvelope {
  content?: RawBlibliProduct[]
}

interface RawPickupPoint {
  code?: string
  name?: string
  address?: unknown
}

const EPOCH_ISO = new Date(0).toISOString()

function toIso(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return EPOCH_ISO
  return new Date(ms).toISOString()
}

function looksLikeBlibliSku(sku: string): boolean {
  return /^[A-Z0-9]+-\d+-\d+-\d+$/.test(sku)
}

function record(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function pickString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value !== '') return value
  }
  return undefined
}

/**
 * Inventory provider Blibli. Stok Blibli per-variant (blibliSku/L4) & per
 * pickup point; domain kami memakai merchantSku (L3). `getStock` = agregat
 * `counter.stock` (Product List V3); `updateStock` butuh blibliSku —
 * di-resolve dari variant list bila input berupa merchantSku. Warehouse =
 * pickup point Blibli.
 */
export class BlibliInventoryProvider implements IInventoryProvider {
  private readonly connector: BlibliConnector
  private readonly shopId: string
  private readonly meta: BlibliRequestMeta

  constructor(connector: BlibliConnector, shopId: string, meta: BlibliRequestMeta) {
    this.connector = connector
    this.shopId = shopId
    this.meta = meta
  }

  async listWarehouses(): Promise<Warehouse[]> {
    try {
      const client = await this.client()
      const env = await callEnvelope(client, PICKUP_POINT_LIST_V2, this.params({}))
      const content = env['content']
      if (!Array.isArray(content)) return []
      return (content as RawPickupPoint[]).map((pp, index) => ({
        id: pp.code ?? `PP-${index + 1}`,
        name: pp.name ?? pp.code ?? `Pickup point ${index + 1}`,
        ...(pp.address !== undefined ? { address: String(pp.address) } : {}),
        raw: pp,
      }))
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async getStock(sku: string): Promise<StockLevel> {
    try {
      const client = await this.client()
      const env = await callEnvelope(
        client,
        PRODUCT_LIST_V3,
        this.params({
          filter: { productSku: sku },
          paging: { page: 0, size: 1 },
          sorting: { by: 'createdDate', direction: 'DESC' },
        }),
      )
      const raw = env as RawStockEnvelope
      const found = (raw.content ?? []).at(0)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${sku} tidak ditemukan di Blibli`, {
          platform: 'blibli',
        })
      }
      const quantity = found.counter?.stock ?? 0
      return {
        sku,
        quantity,
        updatedAt: toIso(found.updatedDate),
        raw: found,
      }
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  async updateStock(input: UpdateStockInput): Promise<StockLevel> {
    try {
      const client = await this.client()
      const blibliSku = await this.resolveBlibliSku(client, input.sku)
      const params: Record<string, unknown> = { 'blibli-sku': blibliSku, availableStock: input.quantity }
      if (input.warehouseId !== undefined) params['pickupPointCode'] = input.warehouseId
      await callRaw<unknown>(client, UPDATE_PRODUCT_STOCK_V1, this.params(params))
      return this.getStock(input.sku)
    } catch (err: unknown) {
      throw mapBlibliError(err, 'blibli')
    }
  }

  /**
   * Resolusi blibliSku (L4): kalau input sudah berformat blibliSku dipakai
   * langsung; selain itu dicari via Product Variant Pickup Point List V1.
   */
  private async resolveBlibliSku(client: BlibliClient, sku: string): Promise<string> {
    if (looksLikeBlibliSku(sku)) return sku
    const env = await callEnvelope(
      client,
      PRODUCT_VARIANT_FILTER_V1,
      this.params({ 'product-sku': sku }),
    )
    const content = env['content']
    if (!Array.isArray(content)) {
      throw new ValidationError(
        `Blibli butuh blibliSku (L4) utk update stok ${sku}; tidak bisa di-resolve dari variant list.`,
        { platform: 'blibli' },
      )
    }
    for (const entry of content) {
      const rec = record(entry)
      if (rec === undefined) continue
      const blibliSku = pickString(rec, ['blibliSku', 'gdnSku', 'itemSku'])
      if (blibliSku === undefined) continue
      const merchant = pickString(rec, ['sellerSku', 'merchantSku']) ?? pickString(rec, ['sku'])
      if (merchant === sku) return blibliSku
      const nested = record(rec['productItem'] ?? rec['product'])
      if (nested !== undefined) {
        const nestedMerchant = pickString(nested, ['sellerSku', 'merchantSku']) ?? pickString(nested, ['sku'])
        if (nestedMerchant === sku) {
          const nestedBlibliSku = pickString(nested, ['blibliSku', 'gdnSku', 'itemSku'])
          if (nestedBlibliSku !== undefined) return nestedBlibliSku
        }
      }
    }
    throw new ValidationError(
      `Tidak ada blibliSku (L4) yang cocok utk SKU ${sku} — set stok langsung pakai blibliSku`,
      { platform: 'blibli' },
    )
  }

  private params(extra: Record<string, unknown>): Record<string, unknown> {
    return {
      requestId: randomUUID(),
      storeCode: this.meta.storeCode,
      username: this.meta.username,
      storeId: this.meta.storeId,
      channelId: this.meta.channelId,
      ...extra,
    }
  }

  private async client(): Promise<BlibliClient> {
    return this.connector.getClient(this.shopId)
  }
}
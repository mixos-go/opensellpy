import {
  NotFoundError,
  type IInventoryProvider,
  type StockLevel,
  type UpdateStockInput,
  type Warehouse,
} from '@opensellpy/core'
import {
  LazadaProductAPIApi,
  type LazadaClient,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import { callRaw } from '../../client/request.js'
import { mapLazadaError } from '../../errors/lazada-error.mapper.js'
import { type RawLazadaProduct, type RawLazadaSku } from '../product/product.mapper.js'

interface RawProductsGet {
  products?: Array<{ item_id?: number }>
}

/**
 * Inventory provider Lazada. Stok di-shared di sini (bukan per domain product).
 * `listWarehouses` tanpa endpoint global → warehouse tunggal `DEFAULT`
 * (Lazada tak punya daftar gudang global via API ini).
 */
export class LazadaInventoryProvider implements IInventoryProvider {
  private readonly connector: LazadaConnector
  private readonly shopId: string

  constructor(connector: LazadaConnector, shopId: string) {
    this.connector = connector
    this.shopId = shopId
  }

  async listWarehouses(): Promise<Warehouse[]> {
    return [
      {
        id: 'DEFAULT',
        name: 'Default warehouse',
        raw: { id: 'DEFAULT' },
      },
    ]
  }

  async getStock(sku: string): Promise<StockLevel> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const found = await this.findSku(api, sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${sku} tidak ditemukan di Lazada`, { platform: 'lazada' })
      }
      const quantity = found.sku.quantity ?? 0
      const updatedAt =
        found.product.updated_time === undefined || found.product.updated_time === ''
          ? new Date(0).toISOString()
          : new Date(Date.parse(found.product.updated_time)).toISOString()
      return { sku, quantity, updatedAt, raw: found.sku }
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  async updateStock(input: UpdateStockInput): Promise<StockLevel> {
    try {
      const api = new LazadaProductAPIApi(await this.client())
      const found = await this.findSku(api, input.sku)
      if (found === undefined) {
        throw new NotFoundError(`Stok SKU ${input.sku} tidak ditemukan di Lazada`, {
          platform: 'lazada',
        })
      }
      const requests: Record<string, unknown> = {
        seller_sku: input.sku,
        quantity: input.quantity,
      }
      if (input.warehouseId !== undefined) requests['warehouse_code'] = input.warehouseId
      await callRaw<Record<string, unknown>>(
        api.updateSellableQuantity({ payload: JSON.stringify({ requests: [requests] }) }),
      )
      return this.getStock(input.sku)
    } catch (err: unknown) {
      throw mapLazadaError(err, 'lazada')
    }
  }

  private async findSku(
    api: LazadaProductAPIApi,
    sku: string,
  ): Promise<{ product: RawLazadaProduct; sku: RawLazadaSku } | undefined> {
    const search = await callRaw<RawProductsGet>(
      api.getProducts({
        filter: 'all',
        limit: '50',
        offset: '0',
        sku_seller_list: JSON.stringify([sku]),
      }),
    )
    const ids = (search.products ?? [])
      .map((p) => p.item_id)
      .filter((id): id is number => id !== undefined)
    for (const itemId of ids) {
      const product = await callRaw<RawLazadaProduct>(
        api.getProductItem({ item_id: itemId }),
      )
      const rawSku = (product.skus ?? []).find((s) => s.seller_sku === sku || s.shop_sku === sku)
      if (rawSku !== undefined) return { product, sku: rawSku }
    }
    return undefined
  }

  private async client(): Promise<LazadaClient> {
    return this.connector.getClient(this.shopId)
  }
}
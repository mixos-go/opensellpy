import type { PlatformAdapter } from '@opensellpy/core'
import type { ShopeeConnector } from '@mixos-go/shopee-sdk'
import { SHOPEE_CAPABILITIES } from './capabilities.js'
import { buildShopeeConnector } from './client/shopee.factory.js'
import type { ShopeeAdapterConfig } from './config.js'
import { ShopeeCategoryProvider } from './domains/category/category.provider.js'
import { ShopeeInventoryProvider } from './domains/inventory/inventory.provider.js'
import { ShopeeLogisticsProvider } from './domains/logistics/logistics.provider.js'
import { ShopeeOrderProvider } from './domains/order/order.provider.js'
import { ShopeeProductProvider } from './domains/product/product.provider.js'

export class ShopeeAdapter implements PlatformAdapter<ShopeeConnector> {
  readonly platform = 'shopee' as const
  readonly capabilities = SHOPEE_CAPABILITIES
  readonly order: ShopeeOrderProvider
  readonly product: ShopeeProductProvider
  readonly category: ShopeeCategoryProvider
  readonly inventory: ShopeeInventoryProvider
  readonly logistics: ShopeeLogisticsProvider
  readonly extra: ShopeeConnector

  constructor(config: ShopeeAdapterConfig) {
    const connector = buildShopeeConnector(config)
    this.extra = connector
    this.order = new ShopeeOrderProvider(connector, config.shopId)
    this.product = new ShopeeProductProvider(connector, config.shopId)
    this.category = new ShopeeCategoryProvider(connector, config.shopId)
    this.inventory = new ShopeeInventoryProvider(connector, config.shopId)
    this.logistics = new ShopeeLogisticsProvider(connector, config.shopId)
  }
}

/** Instantiate adapter Shopee opensellpy. */
export function createShopeeAdapter(config: ShopeeAdapterConfig): ShopeeAdapter {
  return new ShopeeAdapter(config)
}

export type { ShopeeAdapterConfig } from './config.js'
export { mapShopeeError } from './errors/shopee-error.mapper.js'
export { SHOPEE_CAPABILITIES } from './capabilities.js'
export {
  fromShopeeOrder,
  fromShopeeItemBaseInfo,
  fromShopeeCategoryList,
  fromShopeeStockLevel,
  fromShopeeTrackingInfo,
} from './domains/index.js'
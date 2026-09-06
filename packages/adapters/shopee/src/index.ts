import type { PlatformAdapter } from '@mixos-go/opensellpy-core'
import type { ShopeeConnector } from '@mixos-go/shopee-sdk'
import { SHOPEE_CAPABILITIES } from './capabilities.js'
import { buildShopeeConnector } from './client/shopee.factory.js'
import type { ShopeeAdapterConfig } from './config.js'
import { ShopeeCategoryProvider } from './domains/category/category.provider.js'
import { ShopeeInventoryProvider } from './domains/inventory/inventory.provider.js'
import { ShopeeLogisticsProvider } from './domains/logistics/logistics.provider.js'
import { ShopeeOrderProvider } from './domains/order/order.provider.js'
import { ShopeeProductProvider } from './domains/product/product.provider.js'
import { ShopeeWebhookHandler } from './domains/order/order.webhook-mapper.js'

export class ShopeeAdapter implements PlatformAdapter<ShopeeConnector> {
  readonly platform = 'shopee' as const
  readonly capabilities = SHOPEE_CAPABILITIES
  readonly order: ShopeeOrderProvider
  readonly product: ShopeeProductProvider
  readonly category: ShopeeCategoryProvider
  readonly inventory: ShopeeInventoryProvider
  readonly logistics: ShopeeLogisticsProvider
  readonly webhook: ShopeeWebhookHandler
  readonly extra: ShopeeConnector

  constructor(config: ShopeeAdapterConfig) {
    const connector = buildShopeeConnector(config)
    this.extra = connector
    this.order = new ShopeeOrderProvider(connector, config.shopId)
    this.product = new ShopeeProductProvider(connector, config.shopId)
    this.category = new ShopeeCategoryProvider(connector, config.shopId)
    this.inventory = new ShopeeInventoryProvider(connector, config.shopId)
    this.logistics = new ShopeeLogisticsProvider(connector, config.shopId)
    this.webhook = new ShopeeWebhookHandler({ partnerKey: config.credentials.partner_key })
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
export { ShopeeWebhookHandler, computeShopeeWebhookSignature } from './domains/order/order.webhook-mapper.js'
export type { ShopeeWebhookOptions } from './domains/order/order.webhook-mapper.js'
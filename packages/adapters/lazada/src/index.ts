import type { PlatformAdapter } from '@mixos-go/opensellpy-core'
import type { LazadaConnector } from '@mixos-go/lazada-sdk'
import { LAZADA_CAPABILITIES } from './capabilities.js'
import { buildLazadaConnector } from './client/lazada.factory.js'
import type { LazadaAdapterConfig } from './config.js'
import { LazadaCategoryProvider } from './domains/category/category.provider.js'
import { LazadaInventoryProvider } from './domains/inventory/inventory.provider.js'
import { LazadaLogisticsProvider } from './domains/logistics/logistics.provider.js'
import { LazadaOrderProvider } from './domains/order/order.provider.js'
import { LazadaProductProvider } from './domains/product/product.provider.js'
import { LazadaWebhookHandler } from './domains/order/order.webhook-mapper.js'

export class LazadaAdapter implements PlatformAdapter<LazadaConnector> {
  readonly platform = 'lazada' as const
  readonly capabilities = LAZADA_CAPABILITIES
  readonly order: LazadaOrderProvider
  readonly product: LazadaProductProvider
  readonly category: LazadaCategoryProvider
  readonly inventory: LazadaInventoryProvider
  readonly logistics: LazadaLogisticsProvider
  readonly webhook: LazadaWebhookHandler
  readonly extra: LazadaConnector

  constructor(config: LazadaAdapterConfig) {
    const connector = buildLazadaConnector(config)
    this.extra = connector
    this.order = new LazadaOrderProvider(connector, config.shopId)
    this.product = new LazadaProductProvider(connector, config.shopId)
    this.category = new LazadaCategoryProvider(connector, config.shopId)
    this.inventory = new LazadaInventoryProvider(connector, config.shopId)
    this.logistics = new LazadaLogisticsProvider(connector, config.shopId)
    this.webhook = new LazadaWebhookHandler({ appSecret: config.credentials.app_secret })
  }
}

/** Instantiate adapter Lazada opensellpy. */
export function createLazadaAdapter(config: LazadaAdapterConfig): LazadaAdapter {
  return new LazadaAdapter(config)
}

export type { LazadaAdapterConfig } from './config.js'
export { mapLazadaError } from './errors/lazada-error.mapper.js'
export { LAZADA_CAPABILITIES } from './capabilities.js'
export {
  fromLazadaOrder,
  fromLazadaOrderItems,
  fromLazadaOrderStatus,
  fromLazadaOrderStatusToItem,
  fromLazadaProduct,
  fromLazadaProductStatus,
  fromLazadaCategory,
  fromLazadaCategoryList,
  fromLazadaAttributeList,
} from './domains/index.js'
export { LazadaWebhookHandler, computeLazadaWebhookSignature } from './domains/order/order.webhook-mapper.js'
export type { LazadaWebhookOptions } from './domains/order/order.webhook-mapper.js'
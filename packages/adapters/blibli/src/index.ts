import type { PlatformAdapter } from '@mixos-go/opensellpy-core'
import type { BlibliConnector } from '@mixos-go/bli-bli-sdk'
import { BLIBLI_CAPABILITIES } from './capabilities.js'
import { buildBlibliConnector } from './client/blibli.factory.js'
import type { BlibliAdapterConfig } from './config.js'
import { BlibliCategoryProvider } from './domains/category/category.provider.js'
import { BlibliInventoryProvider } from './domains/inventory/inventory.provider.js'
import { BlibliLogisticsProvider } from './domains/logistics/logistics.provider.js'
import { BlibliOrderProvider } from './domains/order/order.provider.js'
import { BlibliProductProvider } from './domains/product/product.provider.js'
import { BlibliWebhookHandler } from './domains/order/order.webhook-mapper.js'

export class BlibliAdapter implements PlatformAdapter<BlibliConnector> {
  readonly platform = 'blibli' as const
  readonly capabilities = BLIBLI_CAPABILITIES
  readonly order: BlibliOrderProvider
  readonly product: BlibliProductProvider
  readonly category: BlibliCategoryProvider
  readonly inventory: BlibliInventoryProvider
  readonly logistics: BlibliLogisticsProvider
  readonly webhook: BlibliWebhookHandler
  readonly extra: BlibliConnector

  constructor(config: BlibliAdapterConfig) {
    const connector = buildBlibliConnector(config)
    this.extra = connector
    // Registrasi eager: Blibli key-based, `getClient(shopId)` butuh
    // apiSellerKey di TokenStore.
    void connector.connect(config.shopId, config.credentials.apiSellerKey).catch(() => undefined)
    this.order = new BlibliOrderProvider(connector, config.shopId, config)
    this.product = new BlibliProductProvider(connector, config.shopId, config)
    this.category = new BlibliCategoryProvider(connector, config.shopId, config)
    this.inventory = new BlibliInventoryProvider(connector, config.shopId, config)
    this.logistics = new BlibliLogisticsProvider(connector, config.shopId, config)
    this.webhook = new BlibliWebhookHandler(
      config.credentials.signatureKey === undefined ? {} : { signatureKey: config.credentials.signatureKey },
    )
  }
}

/** Instantiate adapter Blibli opensellpy. */
export function createBlibliAdapter(config: BlibliAdapterConfig): BlibliAdapter {
  return new BlibliAdapter(config)
}

export type { BlibliAdapterConfig } from './config.js'
export { mapBlibliError } from './errors/blibli-error.mapper.js'
export { BLIBLI_CAPABILITIES } from './capabilities.js'
export {
  fromBlibliAttributeList,
  fromBlibliCategory,
  fromBlibliCategoryList,
  fromBlibliOrderDetail,
  fromBlibliOrderListItem,
  fromBlibliOrderStatus,
  fromBlibliOrderStatusToItem,
  fromBlibliProduct,
  fromBlibliProductState,
  toBlibliListProductsBody,
  toBlibliOrderListBody,
  toBlibliOrderStatuses,
  toBlibliProductStateFilter,
} from './domains/index.js'
export {
  BlibliWebhookHandler,
  buildBlibliWebhookRawString,
  computeBlibliWebhookSignature,
  formatBlibliWibDate,
} from './domains/order/order.webhook-mapper.js'
export type { BlibliWebhookOptions } from './domains/order/order.webhook-mapper.js'
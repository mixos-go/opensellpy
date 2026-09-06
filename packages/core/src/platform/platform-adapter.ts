import type { PlatformKey } from './platform-key.js'
import type { DomainKey } from './domain-key.js'
import type { IOrderProvider } from '../domains/order/order.contract.js'
import type { IProductProvider } from '../domains/product/product.contract.js'
import type { ICategoryProvider } from '../domains/category/category.contract.js'
import type { IInventoryProvider } from '../domains/inventory/inventory.contract.js'
import type { ILogisticsProvider } from '../domains/logistics/logistics.contract.js'
import type { IWebhookHandler } from '../webhook/webhook.contract.js'

/**
 * PlatformAdapter is the surface a single marketplace exposes to `client`.
 */
export interface PlatformAdapter<Extra = unknown> {
  readonly platform: PlatformKey
  readonly capabilities: readonly DomainKey[]
  order: IOrderProvider
  product: IProductProvider
  category: ICategoryProvider
  inventory: IInventoryProvider
  logistics: ILogisticsProvider
  /** Webhook handler platform (opsional — hubungi konfigurasi webhook). */
  webhook?: IWebhookHandler
  extra?: Extra
}

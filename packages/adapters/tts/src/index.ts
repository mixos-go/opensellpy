import type { PlatformAdapter } from '@opensellpy/core'
import type { TikTokShopConnector } from '@mixos-go/tiktok-shop-sdk'
import { TTS_CAPABILITIES } from './capabilities.js'
import { buildTiktokShopConnector } from './client/tts.factory.js'
import type { TtsAdapterConfig } from './config.js'
import { TiktokCategoryProvider } from './domains/category/category.provider.js'
import { TiktokInventoryProvider } from './domains/inventory/inventory.provider.js'
import { TiktokLogisticsProvider } from './domains/logistics/logistics.provider.js'
import { TiktokOrderProvider } from './domains/order/order.provider.js'
import { TiktokProductProvider } from './domains/product/product.provider.js'

export class TtsAdapter implements PlatformAdapter<TikTokShopConnector> {
  readonly platform = 'tts' as const
  readonly capabilities = TTS_CAPABILITIES
  readonly order: TiktokOrderProvider
  readonly product: TiktokProductProvider
  readonly category: TiktokCategoryProvider
  readonly inventory: TiktokInventoryProvider
  readonly logistics: TiktokLogisticsProvider
  readonly extra: TikTokShopConnector

  constructor(config: TtsAdapterConfig) {
    const connector = buildTiktokShopConnector(config)
    this.extra = connector
    this.order = new TiktokOrderProvider(connector, config.shopId)
    this.product = new TiktokProductProvider(connector, config.shopId)
    this.category = new TiktokCategoryProvider(connector, config.shopId)
    this.inventory = new TiktokInventoryProvider(connector, config.shopId)
    this.logistics = new TiktokLogisticsProvider(connector, config.shopId)
  }
}

/** Instantiate adapter TikTok Shop opensellpy. */
export function createTtsAdapter(config: TtsAdapterConfig): TtsAdapter {
  return new TtsAdapter(config)
}

export type { TtsAdapterConfig } from './config.js'
export { mapTiktokError } from './errors/tiktok-error.mapper.js'
export { TTS_CAPABILITIES } from './capabilities.js'
export {
  fromTiktokOrder,
  fromTiktokOrderStatus,
  fromTiktokOrderStatusToItem,
  fromTiktokProduct,
  fromTiktokProductStatus,
  fromTiktokCategoryList,
  fromTiktokAttributeList,
  fromTiktokStockLevel,
  fromTiktokLogisticsStatus,
  fromTiktokTracking,
} from './domains/index.js'
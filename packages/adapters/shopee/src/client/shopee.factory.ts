import { createShopeeConnector, type ShopeeConnector } from '@mixos-go/shopee-sdk'
import type { ShopeeAdapterConfig } from '../config.js'

/**
 * Instantiate connector `@mixos-go/shopee-sdk` dari konfigurasi adapter.
 * Multi-seller: satu adapter = satu shopId; connector menangani token per shop.
 */
export function buildShopeeConnector(config: ShopeeAdapterConfig): ShopeeConnector {
  return createShopeeConnector({
    credentials: config.credentials,
    redirectUri: config.redirectUri,
    store: config.store,
    ...(config.environment !== undefined ? { environment: config.environment } : {}),
    ...(config.region !== undefined ? { region: config.region } : {}),
    ...(config.refreshThresholdMs !== undefined
      ? { refreshThresholdMs: config.refreshThresholdMs }
      : {}),
    ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
  })
}
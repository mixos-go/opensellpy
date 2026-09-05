import {
  createTikTokShopConnector,
  type TikTokShopConnector,
} from '@mixos-go/tiktok-shop-sdk'
import type { TtsAdapterConfig } from '../config.js'

/** Instantiate connector SDK TikTok Shop dari konfigurasi adapter. */
export function buildTiktokShopConnector(config: TtsAdapterConfig): TikTokShopConnector {
  return createTikTokShopConnector({
    credentials: config.credentials,
    redirectUri: config.redirectUri,
    store: config.store,
    ...(config.baseUrl !== undefined ? { baseUrl: config.baseUrl } : {}),
    ...(config.serviceIds !== undefined ? { serviceIds: config.serviceIds } : {}),
    ...(config.shopType !== undefined ? { shopType: config.shopType } : {}),
    ...(config.category !== undefined ? { category: config.category } : {}),
    ...(config.refreshThresholdMs !== undefined
      ? { refreshThresholdMs: config.refreshThresholdMs }
      : {}),
    ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
  })
}
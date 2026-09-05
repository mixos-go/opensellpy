import {
  createLazadaConnector,
  type LazadaConnector,
} from '@mixos-go/lazada-sdk'
import type { LazadaAdapterConfig } from '../config.js'

/** Instantiate connector Lazada dari konfigurasi adapter. */
export function buildLazadaConnector(config: LazadaAdapterConfig): LazadaConnector {
  return createLazadaConnector({
    credentials: config.credentials,
    redirectUri: config.redirectUri,
    store: config.store,
    ...(config.region !== undefined ? { region: config.region } : {}),
    ...(config.refreshThresholdMs !== undefined
      ? { refreshThresholdMs: config.refreshThresholdMs }
      : {}),
    ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
  })
}
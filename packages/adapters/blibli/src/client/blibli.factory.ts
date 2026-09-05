import {
  createBlibliConnector,
  type BlibliConnector,
} from '@mixos-go/bli-bli-sdk'
import type { BlibliAdapterConfig } from '../config.js'

/** Instantiate connector Blibli dari konfigurasi adapter. */
export function buildBlibliConnector(config: BlibliAdapterConfig): BlibliConnector {
  return createBlibliConnector({
    credentials: config.credentials,
    redirectUri: config.redirectUri,
    ...(config.store !== undefined ? { store: config.store } : {}),
    ...(config.environment !== undefined ? { environment: config.environment } : {}),
    ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
  })
}
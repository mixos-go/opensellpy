import type { PlatformKey } from './platform-key.js'
import type { DomainKey } from './domain-key.js'

/**
 * PlatformAdapter is the surface a single marketplace planes to `client`.
 * Provider fields (`order`, `product`, ...) are added in Fase 2 once the
 * domain contracts (`I*Provider` in `domains/`) exist.
 */
export interface PlatformAdapter<Extra = unknown> {
  readonly platform: PlatformKey
  readonly capabilities: readonly DomainKey[]
  readonly extra?: Extra
}

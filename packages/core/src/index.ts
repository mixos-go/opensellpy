export type { Money } from './shared/money.js'
export type { PaginationParams, PaginatedResult } from './shared/pagination.js'

export { PLATFORM_KEYS } from './platform/platform-key.js'
export type { PlatformKey } from './platform/platform-key.js'
export { DOMAIN_KEYS } from './platform/domain-key.js'
export type { DomainKey } from './platform/domain-key.js'
export type { PlatformAdapter } from './platform/platform-adapter.js'

export {
  PlatformError,
  PlatformAuthError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from './errors/index.js'
export type { PlatformErrorOptions } from './errors/index.js'

export type { DomainEvent, EventName } from './events/index.js'

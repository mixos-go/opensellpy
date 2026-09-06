import {
  NotFoundError,
  PlatformAuthError,
  PlatformError,
  RateLimitError,
  ValidationError,
  type PlatformErrorOptions,
  type PlatformKey,
} from '@mixos-go/opensellpy-core'
import { ShopeeError } from '../client/request.js'

/** Fallback konkret utk error Shopee yang tidak terklasifikasi. */
class ShopeeUnclassifiedError extends PlatformError {
  readonly code = 'PLATFORM'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

/**
 * Map error SDK Shopee → error domain opensellpy. Error non-Shopee (nil, error
 * lain) dibungkus `PlatformError` dengan `cause` asli.
 */
export function mapShopeeError(err: unknown, platform: PlatformKey): PlatformError {
  if (err instanceof ShopeeError) {
    return mapShopeeSdkError(err, platform)
  }
  const message = err instanceof Error ? err.message : String(err)
  return new ShopeeUnclassifiedError(message, { platform, cause: err })
}

function mapShopeeSdkError(err: ShopeeError, platform: PlatformKey): PlatformError {
  const code = err.error
  const msg = err.message || 'Shopee API error'

  if (code === undefined) {
    return new ShopeeUnclassifiedError(msg, { platform, cause: err })
  }
  if (isAuthError(code)) {
    return new PlatformAuthError(msg, { platform, cause: err })
  }
  if (isRateLimitError(code)) {
    return new RateLimitError(msg, { platform, cause: err })
  }
  if (isNotFoundError(code)) {
    return new NotFoundError(msg, { platform, cause: err })
  }
  if (isValidationError(code)) {
    return new ValidationError(msg, { platform, cause: err })
  }
  return new ShopeeUnclassifiedError(msg, { platform, cause: err })
}

function isAuthError(code: string): boolean {
  return code.startsWith('error_auth_') || /token|auth/i.test(code)
}

function isRateLimitError(code: string): boolean {
  return /limit|throttl|too_many/i.test(code)
}

function isNotFoundError(code: string): boolean {
  return /not_found|invalid.*id/i.test(code)
}

function isValidationError(code: string): boolean {
  return /param|invalid|missing|format/i.test(code)
}
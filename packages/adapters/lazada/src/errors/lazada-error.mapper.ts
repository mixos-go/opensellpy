import {
  NotFoundError,
  PlatformAuthError,
  PlatformError,
  RateLimitError,
  ValidationError,
  type PlatformErrorOptions,
  type PlatformKey,
} from '@mixos-go/opensellpy-core'
import { LazadaError } from '../client/request.js'

/** Fallback konkret utk error Lazada yang tidak terklasifikasi. */
class LazadaUnclassifiedError extends PlatformError {
  readonly code = 'PLATFORM'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

/**
 * Map error SDK Lazada → error domain opensellpy. Error non-Lazada dibungkus
 * `PlatformError` dengan `cause` asli.
 */
export function mapLazadaError(err: unknown, platform: PlatformKey): PlatformError {
  if (err instanceof LazadaError) {
    return mapLazadaSdkError(err, platform)
  }
  if (err instanceof PlatformError) {
    return err
  }
  const message = err instanceof Error ? err.message : String(err)
  return new LazadaUnclassifiedError(message, { platform, cause: err })
}

function mapLazadaSdkError(err: LazadaError, platform: PlatformKey): PlatformError {
  const code = String(err.code)
  const msg = err.message || 'Lazada API error'

  if (code === 'unknown_error' || code === 'invalid_json') {
    return new LazadaUnclassifiedError(msg, { platform, cause: err })
  }
  const haystack = `${code} ${msg}`
  if (isAuthError(haystack)) {
    return new PlatformAuthError(msg, { platform, cause: err })
  }
  if (isRateLimitError(haystack)) {
    return new RateLimitError(msg, { platform, cause: err })
  }
  if (isNotFoundError(haystack)) {
    return new NotFoundError(msg, { platform, cause: err })
  }
  if (isValidationError(haystack)) {
    return new ValidationError(msg, { platform, cause: err })
  }
  return new LazadaUnclassifiedError(msg, { platform, cause: err })
}

function isAuthError(needle: string): boolean {
  return (
    /token|auth|access|forbidden|unauthorized|permission|sign|appkey|app_key/i.test(needle) &&
    !/invalid.*(param|request|arguments?)/i.test(needle)
  )
}

function isRateLimitError(needle: string): boolean {
  return /limit|throttl|too[ _]?many|frequency|busily|busy|exceed/i.test(needle)
}

function isNotFoundError(needle: string): boolean {
  return /not[ _]found|not exist|does not exist|invalid.*(id|sku)/i.test(needle)
}

function isValidationError(needle: string): boolean {
  return /param|invalid|missing|required|format|unsupported|not support|illegal/i.test(needle)
}
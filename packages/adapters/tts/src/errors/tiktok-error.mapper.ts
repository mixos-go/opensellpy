import {
  NotFoundError,
  PlatformAuthError,
  PlatformError,
  RateLimitError,
  ValidationError,
  type PlatformErrorOptions,
  type PlatformKey,
} from '@opensellpy/core'
import { TikTokError } from '../client/request.js'

/** Fallback konkret utk error TikTok Shop yang tidak terklasifikasi. */
class TiktokUnclassifiedError extends PlatformError {
  readonly code = 'PLATFORM'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

/**
 * Map error SDK TikTok → error domain opensellpy. Error non-TikTok dibungkus
 * `PlatformError` dengan `cause` asli.
 */
export function mapTiktokError(err: unknown, platform: PlatformKey): PlatformError {
  if (err instanceof TikTokError) {
    return mapTiktokSdkError(err, platform)
  }
  const message = err instanceof Error ? err.message : String(err)
  return new TiktokUnclassifiedError(message, { platform, cause: err })
}

function mapTiktokSdkError(err: TikTokError, platform: PlatformKey): PlatformError {
  const code = String(err.code)
  const msg = err.message || 'TikTok Shop API error'

  if (code === 'unknown_error') {
    return new TiktokUnclassifiedError(msg, { platform, cause: err })
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
  return new TiktokUnclassifiedError(msg, { platform, cause: err })
}

function isAuthError(needle: string): boolean {
  return /^1000[0-9]$/.test(needle) || /token|auth|forbidden|unauthorized|permission|sign/i.test(needle)
}

function isRateLimitError(needle: string): boolean {
  return /^5400[0-9]$/.test(needle) || /limit|throttl|too[ _]many|frequency/i.test(needle)
}

function isNotFoundError(needle: string): boolean {
  return /not[ _]found|does not exist|invalid.*(id|sku)|not exist/i.test(needle)
}

function isValidationError(needle: string): boolean {
  return /^2000[0-9]$/.test(needle) || /param|invalid|missing|required|format|unsupported|not support/i.test(needle)
}
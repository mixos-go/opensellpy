import {
  NotFoundError,
  PlatformAuthError,
  PlatformError,
  RateLimitError,
  ValidationError,
  type PlatformErrorOptions,
  type PlatformKey,
} from '@opensellpy/core'
import { BlibliError } from '../client/request.js'

/** Fallback konkret utk error Blibli yang tidak terklasifikasi. */
class BlibliUnclassifiedError extends PlatformError {
  readonly code = 'PLATFORM'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

/**
 * Map error SDK Blibli → error domain opensellpy. Error non-Blibli dibungkus
 * `PlatformError` dengan `cause` asli.
 */
export function mapBlibliError(err: unknown, platform: PlatformKey): PlatformError {
  if (err instanceof BlibliError) {
    return mapBlibliSdkError(err, platform)
  }
  if (err instanceof PlatformError) {
    return err
  }
  const message = err instanceof Error ? err.message : String(err)
  return new BlibliUnclassifiedError(message, { platform, cause: err })
}

function mapBlibliSdkError(err: BlibliError, platform: PlatformKey): PlatformError {
  const code = err.code === undefined ? '' : String(err.code)
  const msg = err.message || 'Blibli API error'
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
  return new BlibliUnclassifiedError(msg, { platform, cause: err })
}

function isAuthError(needle: string): boolean {
  return (
    /token|auth|unauthor|forbidden|permission|sign|client.?key|api.?seller.?key|credential|access/i.test(
      needle,
    ) && !/invalid.*(request|param|argument|payload|body)/i.test(needle)
  )
}

function isRateLimitError(needle: string): boolean {
  return /limit|throttl|too[ _]?many|frequency|exceed|quota/i.test(needle)
}

function isNotFoundError(needle: string): boolean {
  return /not[ _]found|not exist|does not exist|invalid.*(sku|id|product|package)/i.test(needle)
}

function isValidationError(needle: string): boolean {
  return /param|invalid|missing|required|format|unsupported|not support|illegal|mandatory|must be/i.test(
    needle,
  )
}
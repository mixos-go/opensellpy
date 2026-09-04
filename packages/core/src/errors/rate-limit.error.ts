import { PlatformError, type PlatformErrorOptions } from './platform.error.js'

export class RateLimitError extends PlatformError {
  readonly code = 'RATE_LIMIT'

  readonly retryAfterSeconds?: number

  constructor(message: string, options: PlatformErrorOptions & { retryAfterSeconds?: number }) {
    super(message, options)
    if (options.retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = options.retryAfterSeconds
    }
  }
}

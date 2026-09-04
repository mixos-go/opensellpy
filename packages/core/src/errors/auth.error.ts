import { PlatformError, type PlatformErrorOptions } from './platform.error.js'

export class PlatformAuthError extends PlatformError {
  readonly code = 'AUTH_ERROR'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

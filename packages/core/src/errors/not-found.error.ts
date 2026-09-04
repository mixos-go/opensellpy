import { PlatformError, type PlatformErrorOptions } from './platform.error.js'

export class NotFoundError extends PlatformError {
  readonly code = 'NOT_FOUND'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

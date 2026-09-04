import { PlatformError, type PlatformErrorOptions } from './platform.error.js'

export class ValidationError extends PlatformError {
  readonly code = 'VALIDATION'

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options)
  }
}

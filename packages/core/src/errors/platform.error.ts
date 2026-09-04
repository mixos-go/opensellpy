import type { PlatformKey } from '../platform/platform-key.js'

export interface PlatformErrorOptions {
  platform: PlatformKey
  cause?: unknown
}

export abstract class PlatformError extends Error {
  abstract readonly code: string

  readonly platform: PlatformKey

  constructor(message: string, options: PlatformErrorOptions) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = new.target.name
    this.platform = options.platform
  }
}

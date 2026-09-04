import type { PlatformKey } from '@opensellpy/core'

export class PlatformNotRegisteredError extends Error {
  readonly platform: PlatformKey

  constructor(platform: PlatformKey) {
    super(`Platform '${platform}' belum di-register. Panggil client.register(adapter) terlebih dahulu.`)
    this.name = 'PlatformNotRegisteredError'
    this.platform = platform
  }
}
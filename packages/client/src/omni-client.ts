import type { PlatformAdapter, PlatformKey } from '@opensellpy/core'
import { PluginRegistry } from './plugin-registry.js'
import { PlatformNotRegisteredError } from './platform-not-registered.error.js'

export class OmniClient {
  private readonly registry = new PluginRegistry()

  register(adapter: PlatformAdapter): void {
    this.registry.register(adapter)
  }

  platform(key: PlatformKey): PlatformAdapter {
    const adapter = this.registry.get(key)
    if (adapter === undefined) {
      throw new PlatformNotRegisteredError(key)
    }
    return adapter
  }
}
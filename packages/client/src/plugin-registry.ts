import type { PlatformAdapter, PlatformKey } from '@mixos-go/opensellpy-core'

export class PluginRegistry {
  private readonly adapters = new Map<PlatformKey, PlatformAdapter>()

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platform, adapter)
  }

  get(key: PlatformKey): PlatformAdapter | undefined {
    return this.adapters.get(key)
  }

  has(key: PlatformKey): boolean {
    return this.adapters.has(key)
  }
}
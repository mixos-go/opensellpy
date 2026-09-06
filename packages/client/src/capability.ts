import type { DomainKey, PlatformAdapter } from '@mixos-go/opensellpy-core'

export function getCapabilities(adapter: PlatformAdapter): readonly DomainKey[] {
  return adapter.capabilities
}

export function supports(adapter: PlatformAdapter, domain: DomainKey): boolean {
  return adapter.capabilities.includes(domain)
}
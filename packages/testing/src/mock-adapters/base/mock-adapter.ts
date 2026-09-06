import { DOMAIN_KEYS } from '@opensellpy/core'
import type { DomainKey, PlatformAdapter, PlatformKey } from '@opensellpy/core'
import type { MockSeed } from './seed.js'
import { buildMockSeed } from './seed.js'
import { MockBackend } from './mock-backend.js'
import { MockCategoryProvider } from './mock-category.provider.js'
import { MockInventoryProvider } from './mock-inventory.provider.js'
import { MockLogisticsProvider } from './mock-logistics.provider.js'
import { MockOrderProvider } from './mock-order.provider.js'
import { MockProductProvider } from './mock-product.provider.js'

export abstract class BaseMockAdapter implements PlatformAdapter<MockBackend> {
  readonly capabilities: readonly DomainKey[] = DOMAIN_KEYS
  readonly order: MockOrderProvider
  readonly product: MockProductProvider
  readonly category: MockCategoryProvider
  readonly inventory: MockInventoryProvider
  readonly logistics: MockLogisticsProvider
  readonly extra: MockBackend
  readonly platform: PlatformKey

  protected constructor(platform: PlatformKey, seed: MockSeed) {
    this.platform = platform
    const backend = new MockBackend(seed)
    this.extra = backend
    this.order = new MockOrderProvider(backend)
    this.product = new MockProductProvider(backend)
    this.category = new MockCategoryProvider(backend)
    this.inventory = new MockInventoryProvider(backend)
    this.logistics = new MockLogisticsProvider(backend)
  }

  protected static buildSeed(platform: PlatformKey, overrides?: Partial<MockSeed>): MockSeed {
    return buildMockSeed(platform, overrides)
  }
}
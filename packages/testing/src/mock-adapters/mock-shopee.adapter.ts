import type { MockSeed } from './base/seed.js'
import { BaseMockAdapter } from './base/mock-adapter.js'

export class MockShopeeAdapter extends BaseMockAdapter {
  constructor(overrides?: Partial<MockSeed>) {
    super('shopee', BaseMockAdapter.buildSeed('shopee', overrides))
  }
}

export function createMockShopeeAdapter(overrides?: Partial<MockSeed>): MockShopeeAdapter {
  return new MockShopeeAdapter(overrides)
}
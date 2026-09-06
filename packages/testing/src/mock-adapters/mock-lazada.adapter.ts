import type { MockSeed } from './base/seed.js'
import { BaseMockAdapter } from './base/mock-adapter.js'

export class MockLazadaAdapter extends BaseMockAdapter {
  constructor(overrides?: Partial<MockSeed>) {
    super('lazada', BaseMockAdapter.buildSeed('lazada', overrides))
  }
}

export function createMockLazadaAdapter(overrides?: Partial<MockSeed>): MockLazadaAdapter {
  return new MockLazadaAdapter(overrides)
}
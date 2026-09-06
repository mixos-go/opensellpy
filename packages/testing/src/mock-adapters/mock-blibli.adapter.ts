import type { MockSeed } from './base/seed.js'
import { BaseMockAdapter } from './base/mock-adapter.js'

export class MockBlibliAdapter extends BaseMockAdapter {
  constructor(overrides?: Partial<MockSeed>) {
    super('blibli', BaseMockAdapter.buildSeed('blibli', overrides))
  }
}

export function createMockBlibliAdapter(overrides?: Partial<MockSeed>): MockBlibliAdapter {
  return new MockBlibliAdapter(overrides)
}
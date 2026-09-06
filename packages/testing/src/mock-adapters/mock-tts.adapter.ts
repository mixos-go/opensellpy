import type { MockSeed } from './base/seed.js'
import { BaseMockAdapter } from './base/mock-adapter.js'

export class MockTtsAdapter extends BaseMockAdapter {
  constructor(overrides?: Partial<MockSeed>) {
    super('tts', BaseMockAdapter.buildSeed('tts', overrides))
  }
}

export function createMockTtsAdapter(overrides?: Partial<MockSeed>): MockTtsAdapter {
  return new MockTtsAdapter(overrides)
}
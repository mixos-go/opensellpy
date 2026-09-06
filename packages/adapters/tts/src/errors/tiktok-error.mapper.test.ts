import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  NotFoundError,
  PlatformAuthError,
  RateLimitError,
  ValidationError,
} from '@mixos-go/opensellpy-core'
import { TikTokError } from '@mixos-go/tiktok-shop-sdk'
import { mapTiktokError } from './tiktok-error.mapper.js'

test('mapTiktokError mengklasifikasikan error token → PlatformAuthError', () => {
  const mapped = mapTiktokError(new TikTokError('Access token invalid', { code: '10001' }), 'tts')
  assert.ok(mapped instanceof PlatformAuthError)
})

test('mapTiktokError mengklasifikasikan rate limit → RateLimitError', () => {
  const mapped = mapTiktokError(new TikTokError('Too many requests', { code: '54000' }), 'tts')
  assert.ok(mapped instanceof RateLimitError)
})

test('mapTiktokError mengklasifikasikan not found → NotFoundError', () => {
  const mapped = mapTiktokError(new TikTokError('Order not found', { code: '20003' }), 'tts')
  assert.ok(mapped instanceof NotFoundError)
})

test('mapTiktokError mengklasifikasikan param invalid → ValidationError', () => {
  const mapped = mapTiktokError(new TikTokError('Missing required parameter', { code: '20002' }), 'tts')
  assert.ok(mapped instanceof ValidationError)
})

test('mapTiktokError non-TikTok error → PlatformError dengan cause', () => {
  const cause = new Error('network down')
  const mapped = mapTiktokError(cause, 'tts')
  assert.equal(mapped.cause, cause)
})
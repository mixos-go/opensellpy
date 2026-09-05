import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  NotFoundError,
  PlatformAuthError,
  PlatformError,
  RateLimitError,
  ValidationError,
} from '@opensellpy/core'
import { BlibliError } from '../client/request.js'
import { mapBlibliError } from '../errors/blibli-error.mapper.js'

function asPlatformError(err: unknown): PlatformError {
  if (err instanceof PlatformError) return err
  throw new Error(`expected PlatformError, got ${String(err)}`)
}

test('mapBlibliError: error non-Blibli dibungkus PlatformError PLATFORM', () => {
  const err = asPlatformError(mapBlibliError(new RangeError('boom'), 'blibli'))
  assert.equal(err.code, 'PLATFORM')
  assert.equal(err.platform, 'blibli')
  assert.ok(err.cause instanceof RangeError)
})

test('mapBlibliError: PlatformError diteruskan apa adanya', () => {
  const expected = new ValidationError('sudah domain', { platform: 'blibli' })
  assert.equal(mapBlibliError(expected, 'blibli'), expected)
})

test('mapBlibliError: auth → PlatformAuthError', () => {
  const err = new BlibliError('Request is not authorized, Api-Seller-Key is invalid', {
    code: 'ERR-PA401001',
  })
  const mapped = asPlatformError(mapBlibliError(err, 'blibli'))
  assert.ok(mapped instanceof PlatformAuthError)
})

test('mapBlibliError: rate limit → RateLimitError', () => {
  const err = new BlibliError('Quota exceeded, too many request within 30 minutes', {
    code: 'ERR-PA429001',
  })
  const mapped = asPlatformError(mapBlibliError(err, 'blibli'))
  assert.ok(mapped instanceof RateLimitError)
})

test('mapBlibliError: not found → NotFoundError', () => {
  const err = new BlibliError('order item not found', { code: 'ERR-PA404012' })
  const mapped = asPlatformError(mapBlibliError(err, 'blibli'))
  assert.ok(mapped instanceof NotFoundError)
})

test('mapBlibliError: validation → ValidationError', () => {
  const err = new BlibliError('blibliSku is required and cannot be empty', { code: 'ERR-PA400054' })
  const mapped = asPlatformError(mapBlibliError(err, 'blibli'))
  assert.ok(mapped instanceof ValidationError)
})

test('mapBlibliError: tidak dikenal → BlibliUnclassifiedError code PLATFORM', () => {
  const err = new BlibliError('kafka rebalance timeout', { code: 'ERR-XX999999' })
  const mapped = asPlatformError(mapBlibliError(err, 'blibli'))
  assert.equal(mapped.code, 'PLATFORM')
  assert.equal(mapped.message, 'kafka rebalance timeout')
})
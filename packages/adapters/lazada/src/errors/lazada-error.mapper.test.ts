import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  NotFoundError,
  PlatformAuthError,
  RateLimitError,
  ValidationError,
} from '@mixos-go/opensellpy-core'
import { LazadaError } from '@mixos-go/lazada-sdk'
import { mapLazadaError } from './lazada-error.mapper.js'

test('mapLazadaError mengklasifikasikan error token → PlatformAuthError', () => {
  const mapped = mapLazadaError(new LazadaError('Autentikasi gagal', { code: 'IllegalAccessToken' }), 'lazada')
  assert.ok(mapped instanceof PlatformAuthError)
})

test('mapLazadaError mengklasifikasikan rate limit → RateLimitError', () => {
  const mapped = mapLazadaError(new LazadaError('Terlalu banyak request', { code: 'TooManyRequests' }), 'lazada')
  assert.ok(mapped instanceof RateLimitError)
})

test('mapLazadaError mengklasifikasikan not found → NotFoundError', () => {
  const mapped = mapLazadaError(new LazadaError('Order not found', { code: 'NotFound' }), 'lazada')
  assert.ok(mapped instanceof NotFoundError)
})

test('mapLazadaError mengklasifikasikan param invalid → ValidationError', () => {
  const mapped = mapLazadaError(new LazadaError('Args illegal', { code: 'IllegalArgument' }), 'lazada')
  assert.ok(mapped instanceof ValidationError)
})

test('mapLazadaError non-Lazada error → PlatformError dengan cause', () => {
  const cause = new Error('network down')
  const mapped = mapLazadaError(cause, 'lazada')
  assert.equal(mapped.cause, cause)
})
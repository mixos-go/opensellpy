import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  NotFoundError,
  PlatformAuthError,
  RateLimitError,
  ValidationError,
} from '@opensellpy/core'
import { ShopeeError } from '@mixos-go/shopee-sdk'
import { mapShopeeError } from '../errors/shopee-error.mapper.js'

test('mapShopeeError mengklasifikasikan error token → PlatformAuthError', () => {
  const mapped = mapShopeeError(
    new ShopeeError('token tidak valid', { error: 'error_auth_expired' }),
    'shopee',
  )
  assert.ok(mapped instanceof PlatformAuthError)
})

test('mapShopeeError mengklasifikasikan rate limit → RateLimitError', () => {
  const mapped = mapShopeeError(
    new ShopeeError('terlalu banyak request', { error: 'error_limit_requests' }),
    'shopee',
  )
  assert.ok(mapped instanceof RateLimitError)
})

test('mapShopeeError mengklasifikasikan not found → NotFoundError', () => {
  const mapped = mapShopeeError(
    new ShopeeError('order tidak ada', { error: 'error_order_not_found' }),
    'shopee',
  )
  assert.ok(mapped instanceof NotFoundError)
})

test('mapShopeeError mengklasifikasikan param invalid → ValidationError', () => {
  const mapped = mapShopeeError(
    new ShopeeError('param salah', { error: 'error_param_invalid' }),
    'shopee',
  )
  assert.ok(mapped instanceof ValidationError)
})

test('mapShopeeError non-Shopee error → PlatformError dengan cause', () => {
  const cause = new Error('network down')
  const mapped = mapShopeeError(cause, 'shopee')
  assert.equal(mapped.cause, cause)
})
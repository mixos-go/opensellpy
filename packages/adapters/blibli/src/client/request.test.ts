import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { BlibliClient } from '@mixos-go/bli-bli-sdk'
import { BlibliError, assertOk, callEnvelope, callRaw } from '../client/request.js'

function stubClient(response: unknown): BlibliClient {
  return {
    request: async () => response,
  } as unknown as BlibliClient
}

const SPEC = {
  method: 'POST' as const,
  path: '/dummy',
  query: ['requestId'],
  pathParams: [],
  body: [],
}

test('callRaw membuka envelope { requestId, content }', async () => {
  const client = stubClient({ requestId: 'r1', content: [{ a: 1 }] })
  const out = await callRaw<Array<{ a: number }>>(client, SPEC, {})
  assert.deepEqual(out, [{ a: 1 }])
})

test('callRaw membuka envelope mtaapi { success: true, value }', async () => {
  const client = stubClient({ requestId: 'r1', success: true, errorCode: '', errorMessage: '', value: { packageId: 9 } })
  const out = await callRaw<{ packageId: number }>(client, SPEC, {})
  assert.deepEqual(out, { packageId: 9 })
})

test('callRaw embalikan null utk 204 (response kosong)', async () => {
  const client = stubClient(null)
  const out = await callRaw<unknown>(client, SPEC, {})
  assert.equal(out, null)
})

test('callRaw melempar BlibliError utk envelope success:false', async () => {
  const client = stubClient({ requestId: 'r1', success: false, errorCode: 'ERR-PA400054', errorMessage: 'bad payload' })
  await assert.rejects(callRaw<unknown>(client, SPEC, {}), (err: unknown) => {
    assert.ok(err instanceof BlibliError)
    assert.equal(err.message, 'bad payload')
    assert.equal(err.code, 'ERR-PA400054')
    return true
  })
})

test('callRaw melempar BlibliError utk errorCode terisi tanpa flag success', async () => {
  const client = stubClient({ errorCode: 'ERR-PA404012', errorMessage: 'not found' })
  await assert.rejects(callRaw<unknown>(client, SPEC, {}), (err: unknown) => {
    assert.ok(err instanceof BlibliError)
    assert.equal(err.code, 'ERR-PA404012')
    return true
  })
})

test('callRaw non-JSON string dibungkus BlibliError', async () => {
  const client = stubClient('<html>Bad Gateway</html>')
  await assert.rejects(callRaw<unknown>(client, SPEC, {}), BlibliError)
})

test('callEnvelope mengembalikan envelope penuh + paging', async () => {
  const client = stubClient({
    requestId: 'r1',
    content: [{}],
    paging: { pageNumber: 0, totalPage: 3, totalRecord: 55 },
  })
  const env = await callEnvelope(client, SPEC, {})
  assert.equal(env.requestId, 'r1')
  assert.deepEqual(env.paging, { pageNumber: 0, totalPage: 3, totalRecord: 55 })
})

test('assertOk menerima envelope sukses mtaapi dengan errorCode kosong', () => {
  assert.doesNotThrow(() =>
    assertOk({ requestId: 'r1', success: true, errorCode: '', errorMessage: '', content: [] }),
  )
})

test('assertOk menerima null, array, dan void', () => {
  assert.doesNotThrow(() => assertOk(null))
  assert.doesNotThrow(() => assertOk(undefined))
  assert.doesNotThrow(() => assertOk([{ a: 1 }]))
})
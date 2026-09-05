import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromLazadaAttributeList, fromLazadaCategoryList } from '../category/category.mapper.js'

test('fromLazadaCategoryList memetakan tree nested Lazada', () => {
  const roots = fromLazadaCategoryList([
    {
      category_id: 1,
      name: 'Fashion',
      children: [
        {
          category_id: 2,
          name: 'Baju',
          children: [{ category_id: 3, name: 'Kaos' }],
        },
      ],
    },
  ])
  assert.equal(roots.length, 1)
  assert.equal(roots[0]?.id, '1')
  assert.equal(roots[0]?.children.length, 1)
  assert.equal(roots[0]?.children[0]?.id, '2')
  assert.equal(roots[0]?.children[0]?.children[0]?.name, 'Kaos')
})

test('fromLazadaCategoryList kategori kosong → array kosong', () => {
  assert.equal(fromLazadaCategoryList([]).length, 0)
})

test('fromLazadaAttributeList memetakan attribute', () => {
  const attrs = fromLazadaAttributeList([
    { id: 10, label: 'Warna', is_mandatory: 1 },
    { id: 11, name: 'Ukuran', is_mandatory: 0 },
  ])
  assert.equal(attrs.length, 2)
  assert.equal(attrs[0]?.id, '10')
  assert.equal(attrs[0]?.name, 'Warna')
  assert.equal(attrs[0]?.required, true)
  assert.equal(attrs[1]?.required, false)
})
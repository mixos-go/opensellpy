import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromTiktokAttributeList, fromTiktokCategoryList } from '../category/category.mapper.js'

test('fromTiktokCategoryList membangun pohon kategori', () => {
  const roots = fromTiktokCategoryList([
    { id: '1', parent_id: '0', name: 'Fashion' },
    { id: '2', parent_id: '1', name: 'Baju' },
    { id: '3', parent_id: '2', name: 'Kaos' },
  ])
  assert.equal(roots.length, 1)
  assert.equal(roots[0]?.id, '1')
  assert.equal(roots[0]?.children.length, 1)
  assert.equal(roots[0]?.children[0]?.id, '2')
  assert.equal(roots[0]?.children[0]?.children[0]?.name, 'Kaos')
})

test('fromTiktokCategoryList kategori parent tak dikenal → jadi root', () => {
  const roots = fromTiktokCategoryList([{ id: '9', parent_id: '77', name: 'Yatim' }])
  assert.equal(roots.length, 1)
  assert.equal(roots[0]?.name, 'Yatim')
})

test('fromTiktokAttributeList memetakan attribute', () => {
  const attrs = fromTiktokAttributeList([
    { id: '10', name: 'Warna', is_required: true },
    { id: '11', name: 'Ukuran', is_required: false },
  ])
  assert.equal(attrs.length, 2)
  assert.equal(attrs[0]?.id, '10')
  assert.equal(attrs[0]?.required, true)
  assert.equal(attrs[1]?.required, false)
})
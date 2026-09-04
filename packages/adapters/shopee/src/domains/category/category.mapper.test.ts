import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeAttributeList, fromShopeeCategoryList } from '../category/category.mapper.js'

test('fromShopeeCategoryList membangun pohon kategori', () => {
  const roots = fromShopeeCategoryList([
    { category_id: 1, parent_category_id: 0, display_category_name: 'Fashion', has_children: true },
    { category_id: 2, parent_category_id: 1, display_category_name: 'Baju', has_children: false },
    { category_id: 3, parent_category_id: 2, display_category_name: 'Kaos', has_children: false },
  ])
  assert.equal(roots.length, 1)
  assert.equal(roots[0]?.id, '1')
  assert.equal(roots[0]?.children.length, 1)
  assert.equal(roots[0]?.children[0]?.id, '2')
  assert.equal(roots[0]?.children[0]?.children[0]?.name, 'Kaos')
})

test('fromShopeeCategoryList kategori parent tak dikenal → jadi root', () => {
  const roots = fromShopeeCategoryList([
    { category_id: 9, parent_category_id: 77, original_category_name: 'Yatim' },
  ])
  assert.equal(roots.length, 1)
  assert.equal(roots[0]?.name, 'Yatim')
})

test('fromShopeeAttributeList memetakan attribute tree', () => {
  const attrs = fromShopeeAttributeList([
    { attribute_id: 10, name: 'Warna', mandatory: true },
    { attribute_id: 11, name: 'Ukuran', mandatory: false },
  ])
  assert.equal(attrs.length, 2)
  assert.equal(attrs[0]?.id, '10')
  assert.equal(attrs[0]?.required, true)
  assert.equal(attrs[1]?.required, false)
})
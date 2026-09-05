import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromBlibliAttributeList,
  fromBlibliCategory,
  fromBlibliCategoryList,
} from '../category/category.mapper.js'

test('fromBlibliCategory memetakan node tree recursive', () => {
  const category = fromBlibliCategory({
    code: 'PH-00001',
    nameLocale: { ID: 'Fashion Pria', EN: 'Fashion Pria EN' },
    children: [
      {
        code: 'PH-00002',
        nameLocale: { ID: 'Kemeja' },
        children: [{ code: 'PH-00003', name: 'Kemeja Polos' }],
      },
    ],
  })
  assert.equal(category.id, 'PH-00001')
  assert.equal(category.platformCategoryId, 'PH-00001')
  assert.equal(category.name, 'Fashion Pria')
  assert.equal(category.children.length, 1)
  assert.equal(category.children[0]?.name, 'Kemeja')
  assert.equal(category.children[0]?.children[0]?.name, 'Kemeja Polos')
})

test('fromBlibliCategoryList memetakan root list', () => {
  const list = fromBlibliCategoryList([
    { code: 'A', name: 'Satu' },
    { code: 'B', name: 'Dua' },
  ])
  assert.equal(list.length, 2)
  assert.equal(list[1]?.name, 'Dua')
})

test('fromBlibliAttributeList memetakan attribute + required', () => {
  const attrs = fromBlibliAttributeList([
    {
      code: 'BR-00001',
      name: 'Bahan',
      nameLocale: { ID: 'Bahan' },
      type: 'PREDEFINED_ATTRIBUTE',
      mandatory: true,
      options: ['Kulit', 'Kain'],
    },
    { code: 'WA-00002', name: 'Warna', type: 'DESCRIPTIVE', mandatory: false },
  ])
  assert.equal(attrs.length, 2)
  assert.equal(attrs[0]?.id, 'BR-00001')
  assert.equal(attrs[0]?.name, 'Bahan')
  assert.equal(attrs[0]?.required, true)
  assert.equal(attrs[1]?.required, false)
})
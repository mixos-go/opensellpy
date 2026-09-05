import type { ApiCallSpec } from '@mixos-go/bli-bli-sdk'

/** Category Tree V1 — GET /mtaapi/api/businesspartner/v1/product/getCategory (5 req/hari). */
export const CATEGORY_TREE_V1: ApiCallSpec = {
  method: 'GET',
  path: '/mtaapi/api/businesspartner/v1/product/getCategory',
  query: ['requestId', 'businessPartnerCode', 'channelId'],
  pathParams: [],
  body: [],
}

/** Category Attributes V2 — GET /seller/v1/categories/{category-code}/attributes (5 req/hari). */
export const CATEGORY_ATTRIBUTES_V2: ApiCallSpec = {
  method: 'GET',
  path: '/seller/v1/categories/{category-code}/attributes',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [['category-code', 'category-code']],
  body: [],
}
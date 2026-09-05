import type { ApiCallSpec } from '@mixos-go/bli-bli-sdk'

/** Product List V3 — POST /seller/v1/products/filter. */
export const PRODUCT_LIST_V3: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/products/filter',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [],
  body: ['filter', 'paging', 'sorting'],
}

/** Product Detail V2 — GET /seller/v1/products/{product-sku} (product-sku = L3/merchantSku). */
export const PRODUCT_DETAIL_V2: ApiCallSpec = {
  method: 'GET',
  path: '/seller/v1/products/{product-sku}',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [['product-sku', 'product-sku']],
  body: [],
}

/** Create Product V3 — POST /seller/v1/products/async (async queue, 202). */
export const CREATE_PRODUCT_V3: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/products/async',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [],
  body: ['product'],
}

/** Update Product Detail by Product SKU V2 — PUT /seller/v1/products/{product-sku}/detail. */
export const UPDATE_PRODUCT_DETAIL_V2: ApiCallSpec = {
  method: 'PUT',
  path: '/seller/v1/products/{product-sku}/detail',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [['product-sku', 'product-sku']],
  body: ['name', 'description', 'attributes', 'dimension', 'logistics'],
}

/** Archive Product V2 — POST /seller/v1/products/statuses/archive. */
export const ARCHIVE_PRODUCT_V2: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/products/statuses/archive',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [],
  body: [],
}

/** Unarchive Product V2 — POST /seller/v1/products/statuses/unarchive. */
export const UNARCHIVE_PRODUCT_V2: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/products/statuses/unarchive',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [],
  body: [],
}
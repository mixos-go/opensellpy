import type { ApiCallSpec } from '@mixos-go/bli-bli-sdk'

/** Pickup Point List V2 — POST /seller/v1/stores/pickup-points/filter (= warehouse Blibli). */
export const PICKUP_POINT_LIST_V2: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/stores/pickup-points/filter',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [],
  body: [],
}

/** Product Variant Pickup Point List V1 — POST /seller/v1/products/{product-sku}/variants/filter. */
export const PRODUCT_VARIANT_FILTER_V1: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/products/{product-sku}/variants/filter',
  query: ['requestId', 'storeCode', 'username', 'storeId', 'channelId'],
  pathParams: [['product-sku', 'product-sku']],
  body: [],
}

/** Update Product Stock by Exact Value V1 — PUT /seller/v1/products/{blibli-sku}/stock (204). */
export const UPDATE_PRODUCT_STOCK_V1: ApiCallSpec = {
  method: 'PUT',
  path: '/seller/v1/products/{blibli-sku}/stock',
  query: ['requestId', 'storeId', 'channelId', 'username', 'storeCode', 'pickupPointCode'],
  pathParams: [['blibli-sku', 'blibli-sku']],
  body: ['availableStock'],
}
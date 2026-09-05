import type { ApiCallSpec } from '@mixos-go/bli-bli-sdk'

/** Order List V2 — POST /seller/v1/orders/packages/filter (100 req/30 mnt, size ≤ 50). */
export const ORDER_LIST_V2: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/orders/packages/filter',
  query: ['storeCode', 'username', 'requestId', 'storeId', 'channelId'],
  pathParams: [],
  body: ['filter', 'paging', 'sorting'],
}

/** Order Detail V2 — GET /seller/v1/orders/items/{order-item-id} (5 req/30 mnt). */
export const ORDER_DETAIL_V2: ApiCallSpec = {
  method: 'GET',
  path: '/seller/v1/orders/items/{order-item-id}',
  query: ['requestId', 'username', 'storeId', 'storeCode', 'channelId'],
  pathParams: [['order-item-id', 'order-item-id']],
  body: [],
}

/** Fulfill Regular Order V2 — POST /seller/v1/orders/regular/{package-id}/fulfill (5 req/hari). */
export const FULFILL_REGULAR_V2: ApiCallSpec = {
  method: 'POST',
  path: '/seller/v1/orders/regular/{package-id}/fulfill',
  query: ['requestId', 'storeId', 'channelId', 'username', 'storeCode'],
  pathParams: [['package-id', 'package-id']],
  body: ['awbNo'],
}

/** Create Package V1 — POST /mtaapi/api/businesspartner/v1/order/createPackage. */
export const CREATE_PACKAGE_V1: ApiCallSpec = {
  method: 'POST',
  path: '/mtaapi/api/businesspartner/v1/order/createPackage',
  query: ['requestId', 'storeId', 'businessPartnerCode', 'channelId'],
  pathParams: [],
  body: ['orderItemIds'],
}

/** Combine Shipping List V1 — GET /mtaapi/api/businesspartner/v1/order/getCombineShipping. */
export const COMBINE_SHIPPING_V1: ApiCallSpec = {
  method: 'GET',
  path: '/mtaapi/api/businesspartner/v1/order/getCombineShipping',
  query: ['businessPartnerCode', 'requestId', 'storeId', 'orderItemNo', 'channelId'],
  pathParams: [],
  body: [],
}
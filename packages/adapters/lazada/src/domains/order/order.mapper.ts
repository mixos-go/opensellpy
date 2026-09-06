import type { Money, Order, OrderAddress, OrderItem } from '@mixos-go/opensellpy-core'
import { fromLazadaOrderStatus, fromLazadaOrderStatusToItem, pickLazadaOrderStatus } from './order.status-map.js'

/** Bentuk minimal raw order dari orders/get & order/get (Lazada). */
export interface RawLazadaOrder {
  order_id?: number | string
  order_number?: number | string
  statuses?: string[]
  status?: string
  created_at?: string
  updated_at?: string
  price?: string
  address_shipping?: RawLazadaAddress
  items_count?: number
}

export interface RawLazadaAddress {
  first_name?: string
  last_name?: string
  phone?: string
  phone2?: string
  address1?: string
  address2?: string
  address3?: string
  address4?: string
  address5?: string
  city?: string
  post_code?: string
  country?: string
  addressDistrict?: string
}

/** Bentuk minimal raw order item dari order/items/get (Lazada). */
export interface RawLazadaOrderItem {
  order_item_id?: number
  order_id?: number
  name?: string
  sku?: string
  shop_sku?: string
  quantity?: number
  item_price?: string
  currency?: string
  status?: string
  created_at?: string
  updated_at?: string
  tracking_code?: string
  tracking_code_pre?: string
  shipment_provider?: string
  package_id?: string
}

const EPOCH_ISO = new Date(0).toISOString()

function toIso(raw: string | undefined): string {
  if (raw === undefined || raw === '') return EPOCH_ISO
  const t = Date.parse(raw)
  return Number.isNaN(t) ? EPOCH_ISO : new Date(t).toISOString()
}

function moneyFrom(amount: string | number | undefined, currency: string | undefined): Money {
  const value = typeof amount === 'string' ? Number(amount) : (amount ?? 0)
  return { amount: Number.isFinite(value) ? value : 0, currency: currency ?? '' }
}

function mapItem(raw: RawLazadaOrderItem): OrderItem {
  return {
    id: String(raw.order_item_id ?? ''),
    sku: raw.sku ?? raw.shop_sku ?? '',
    name: raw.name ?? '',
    quantity: raw.quantity ?? 0,
    unitPrice: moneyFrom(raw.item_price, raw.currency),
    status: fromLazadaOrderStatusToItem(raw.status),
  }
}

/** Map daftar raw order item → OrderItem domain. */
export function fromLazadaOrderItems(rawList: RawLazadaOrderItem[]): OrderItem[] {
  return rawList.map(mapItem)
}

function mapAddress(raw: RawLazadaAddress): OrderAddress {
  return {
    name: [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim(),
    phone: raw.phone ?? raw.phone2 ?? '',
    line1: raw.address1 ?? '',
    city: raw.city ?? '',
    state: raw.addressDistrict ?? '',
    postalCode: raw.post_code ?? '',
    country: raw.country ?? '',
  }
}

/**
 * Map satu raw order Lazada (+ raw items dari `getOrderItems`) → Order domain.
 */
export function fromLazadaOrder(
  raw: RawLazadaOrder,
  rawItems: RawLazadaOrderItem[] = [],
  currency: string | undefined = undefined,
): Order {
  const id = String(raw.order_id ?? raw.order_number ?? '')
  const statusRaw = pickLazadaOrderStatus(raw.statuses) ?? raw.status
  const items = fromLazadaOrderItems(rawItems)
  const address = raw.address_shipping === undefined ? undefined : mapAddress(raw.address_shipping)
  let total: Money | undefined
  if (raw.price !== undefined) {
    total = moneyFrom(raw.price, currency ?? items[0]?.unitPrice.currency)
  } else if (items.length > 0) {
    const sum = items.reduce((acc, it) => acc + it.unitPrice.amount * it.quantity, 0)
    total = moneyFrom(sum, items[0]?.unitPrice.currency)
  }
  return {
    id,
    platformOrderId: id,
    status: fromLazadaOrderStatus(statusRaw),
    items,
    ...(total !== undefined ? { total } : {}),
    ...(address !== undefined ? { shippingAddress: address } : {}),
    createdAt: toIso(raw.created_at),
    updatedAt: toIso(raw.updated_at),
    raw,
  }
}
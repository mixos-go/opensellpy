import type { Money, Order, OrderAddress, OrderItem } from '@opensellpy/core'
import { fromShopeeOrderStatus, fromShopeeOrderStatusToItem } from './order.status-map.js'

/** Bentuk minimal raw order dari get_order_list / get_order_detail (Shopee). */
export interface RawOrder {
  order_sn?: string
  order_status?: string
  currency?: string
  total_amount?: number
  create_time?: number
  update_time?: number
  item_list?: RawOrderItem[]
  recipient_address?: RawAddress
}

interface RawOrderItem {
  order_item_id?: number
  item_id?: number
  model_id?: number
  item_sku?: string
  model_sku?: string
  item_name?: string
  model_name?: string
  model_quantity_purchased?: number
  model_discounted_price?: number
  model_original_price?: number
}

interface RawAddress {
  name?: string
  phone?: string
  city?: string
  state?: string
  region?: string
  full_address?: string
  zipcode?: string
}

function toEpochIso(raw: number | undefined): string {
  if (raw === undefined) return new Date(0).toISOString()
  return new Date(raw * 1000).toISOString()
}

function toMoney(amount: number | undefined, currency: string | undefined): Money {
  return { amount: amount ?? 0, currency: currency ?? '' }
}

function mapItem(raw: RawOrderItem, orderStatus: string | undefined, currency: string | undefined): OrderItem {
  const itemId = raw.order_item_id ?? raw.model_id ?? raw.item_id
  const unitPrice = toMoney(raw.model_discounted_price ?? raw.model_original_price, currency)
  return {
    id: itemId === undefined ? '' : String(itemId),
    sku: raw.model_sku ?? raw.item_sku ?? '',
    name: raw.model_name ?? raw.item_name ?? '',
    quantity: raw.model_quantity_purchased ?? 0,
    unitPrice,
    status: fromShopeeOrderStatusToItem(orderStatus),
  }
}

function mapAddress(raw: RawAddress | undefined): OrderAddress | undefined {
  if (raw === undefined) return undefined
  return {
    name: raw.name ?? '',
    phone: raw.phone ?? '',
    line1: raw.full_address ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.zipcode ?? '',
    country: raw.region ?? '',
  }
}

/** Map satu raw order Shopee → Order domain opensellpy. */
export function fromShopeeOrder(raw: RawOrder): Order {
  const currency = raw.currency
  const items = (raw.item_list ?? []).map((it) => mapItem(it, raw.order_status, currency))
  const shippingAddress = raw.recipient_address === undefined ? undefined : mapAddress(raw.recipient_address)
  return {
    id: raw.order_sn ?? '',
    platformOrderId: raw.order_sn ?? '',
    status: fromShopeeOrderStatus(raw.order_status),
    items,
    ...(shippingAddress !== undefined ? { shippingAddress } : {}),
    ...(raw.total_amount !== undefined
      ? { total: toMoney(raw.total_amount, currency) }
      : {}),
    createdAt: toEpochIso(raw.create_time),
    updatedAt: toEpochIso(raw.update_time),
    raw,
  }
}
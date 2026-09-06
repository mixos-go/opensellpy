import type { Money, Order, OrderAddress, OrderItem } from '@mixos-go/opensellpy-core'
import { fromTiktokOrderStatus, fromTiktokOrderStatusToItem } from './order.status-map.js'

/** Bentuk minimal raw order dari order search/detail (TikTok Shop). */
export interface RawTiktokOrder {
  id?: string
  order_status?: string
  create_time?: number
  update_time?: number
  payment?: {
    currency?: string
    total_amount?: string
  }
  recipient_address?: RawTiktokAddress
  line_items?: RawTiktokLineItem[]
}

export interface RawTiktokLineItem {
  id?: string
  seller_sku?: string
  sku_id?: string
  product_name?: string
  quantity?: number
  sale_price?: {
    amount?: string
    currency?: string
  }
}

interface RawTiktokAddress {
  name?: string
  phone_number?: string
  full_address?: string
  address_detail?: string
  post_town?: string
  postal_code?: string
  region_code?: string
}

function toEpochIso(raw: number | undefined): string {
  if (raw === undefined) return new Date(0).toISOString()
  return new Date(raw * 1000).toISOString()
}

function moneyFrom(amount: string | number | undefined, currency: string | undefined): Money {
  const value = typeof amount === 'string' ? Number(amount) : (amount ?? 0)
  return { amount: Number.isFinite(value) ? value : 0, currency: currency ?? '' }
}

function mapItem(
  raw: RawTiktokLineItem,
  orderStatus: string | undefined,
  fallbackCurrency: string | undefined,
): OrderItem {
  const price = moneyFrom(raw.sale_price?.amount, raw.sale_price?.currency ?? fallbackCurrency)
  return {
    id: raw.id ?? '',
    sku: raw.seller_sku ?? '',
    name: raw.product_name ?? '',
    quantity: raw.quantity ?? 0,
    unitPrice: price,
    status: fromTiktokOrderStatusToItem(orderStatus),
  }
}

function mapAddress(raw: RawTiktokAddress | undefined): OrderAddress | undefined {
  if (raw === undefined) return undefined
  return {
    name: raw.name ?? '',
    phone: raw.phone_number ?? '',
    line1: raw.full_address ?? raw.address_detail ?? '',
    city: raw.post_town ?? '',
    state: '',
    postalCode: raw.postal_code ?? '',
    country: raw.region_code ?? '',
  }
}

/** Map satu raw order TikTok → Order domain opensellpy. */
export function fromTiktokOrder(raw: RawTiktokOrder): Order {
  const currency = raw.payment?.currency
  const items = (raw.line_items ?? []).map((it) => mapItem(it, raw.order_status, currency))
  const shippingAddress = raw.recipient_address === undefined ? undefined : mapAddress(raw.recipient_address)
  return {
    id: raw.id ?? '',
    platformOrderId: raw.id ?? '',
    status: fromTiktokOrderStatus(raw.order_status),
    items,
    ...(shippingAddress !== undefined ? { shippingAddress } : {}),
    ...(raw.payment !== undefined && raw.payment.total_amount !== undefined
      ? { total: moneyFrom(raw.payment.total_amount, currency) }
      : {}),
    createdAt: toEpochIso(raw.create_time),
    updatedAt: toEpochIso(raw.update_time),
    raw,
  }
}
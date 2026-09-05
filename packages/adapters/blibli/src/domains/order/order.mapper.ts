import type { Money, Order, OrderAddress, OrderItem } from '@opensellpy/core'
import {
  fromBlibliOrderStatus,
  fromBlibliOrderStatusToItem,
} from './order.status-map.js'

/** Satu paket (group) dari Order List V2. */
export interface RawBlibliPackage {
  packageId?: number
  orderItems?: RawBlibliOrderListItem[]
}

/** Satu baris order-item dalam paket (Order List V2). */
export interface RawBlibliOrderListItem {
  createdDate?: number
  order?: RawBlibliOrderLine
  product?: RawBlibliOrderProduct
  storeCode?: string
  sellerDeliveryType?: string
}

export interface RawBlibliOrderLine {
  itemId?: string
  id?: string
  quantity?: number
  itemStatus?: string
  statusFPUpdatedTimestamp?: number
  date?: number
}

export interface RawBlibliOrderProduct {
  sellerSku?: string
  itemName?: string
  price?: number
}

/** Content dari Order Detail V2. */
export interface RawBlibliOrderDetail {
  id?: string
  itemId?: string
  packageId?: number
  status?: string
  quantity?: number
  timestamp?: { statusUpdatedToFP?: number }
  histories?: Array<{ status?: string; timestamp?: number }>
  amount?: { seller?: number; itemTotal?: number; item?: number }
  shipment?: unknown
  recipient?: RawBlibliRecipient
  product?: { blibliSku?: string; sellerSku?: string; name?: string }
}

export interface RawBlibliRecipient {
  name?: string
  streetAddress?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phoneNumber?: string
}

const EPOCH_ISO = new Date(0).toISOString()

function toIso(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return EPOCH_ISO
  return new Date(ms).toISOString()
}

function moneyFrom(amount: number | undefined): Money {
  const value = amount ?? 0
  return { amount: Number.isFinite(value) ? value : 0, currency: 'IDR' }
}

function mapItem(itemId: string, sku: string, name: string, qty: number, price: number | undefined, status: string | undefined): OrderItem {
  return {
    id: itemId,
    sku,
    name,
    quantity: qty,
    unitPrice: moneyFrom(price),
    status: fromBlibliOrderStatusToItem(status),
  }
}

/** Map satu baris order-item dari Order List V2 → Order domain. */
export function fromBlibliOrderListItem(raw: RawBlibliOrderListItem): Order {
  const line = raw.order ?? {}
  const product = raw.product ?? {}
  const itemId = line.itemId ?? ''
  const qty = line.quantity ?? 0
  const price = product.price ?? 0
  return {
    id: itemId,
    platformOrderId: line.id ?? itemId,
    status: fromBlibliOrderStatus(line.itemStatus),
    items: [mapItem(itemId, product.sellerSku ?? '', product.itemName ?? '', qty, price, line.itemStatus)],
    total: moneyFrom(price * qty),
    createdAt: toIso(raw.createdDate),
    updatedAt: toIso(line.statusFPUpdatedTimestamp),
    raw,
  }
}

/** Map daftar paket Order List V2 → Order[] domain (satu Order per order item). */
export function fromBlibliPackageList(rawList: RawBlibliPackage[]): Order[] {
  const out: Order[] = []
  for (const pkg of rawList) {
    for (const item of pkg.orderItems ?? []) {
      out.push(fromBlibliOrderListItem(item))
    }
  }
  return out
}

function mapRecipient(raw: RawBlibliRecipient | undefined): OrderAddress | undefined {
  if (raw === undefined) return undefined
  return {
    name: raw.name ?? '',
    phone: raw.phoneNumber ?? '',
    line1: raw.streetAddress ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.zipCode ?? '',
    country: raw.country ?? '',
  }
}

/** Map content Order Detail V2 → Order domain (lengkap dengan alamat pengiriman). */
export function fromBlibliOrderDetail(raw: RawBlibliOrderDetail): Order {
  const itemId = raw.itemId ?? raw.id ?? ''
  const qty = raw.quantity ?? 0
  const product = raw.product ?? {}
  const address = mapRecipient(raw.recipient)
  const createdAt = toIso(raw.timestamp?.statusUpdatedToFP ?? raw.histories?.[0]?.timestamp)
  const updatedAt = toIso(raw.histories?.at(-1)?.timestamp ?? raw.timestamp?.statusUpdatedToFP)
  return {
    id: itemId,
    platformOrderId: raw.id ?? itemId,
    status: fromBlibliOrderStatus(raw.status),
    items: [
      mapItem(itemId, product.sellerSku ?? '', product.name ?? '', qty, raw.amount?.item, raw.status),
    ],
    total: moneyFrom(raw.amount?.itemTotal),
    ...(address !== undefined ? { shippingAddress: address } : {}),
    createdAt,
    updatedAt,
    raw,
  }
}
import type { Order, Shipment, WebhookOrderEvent } from '@opensellpy/core'

function money(amount: number | undefined, currency: string | undefined): string {
  return `${amount ?? 0} ${currency ?? ''}`.trim()
}

/** Tabel order ringkas per platform (format manual, tanpa depend eksternal). */
export function renderOrders(platform: string, orders: readonly Order[]): string {
  const lines: string[] = [
    '',
    `## Order — ${platform}`,
    `${'ID'.padEnd(18)} ${'Status'.padEnd(13)} ${'Item'.padEnd(28)} Qty  Total`,
  ]
  for (const order of orders) {
    const firstItem = order.items[0]
    const itemLabel =
      firstItem === undefined ? '-' : `${firstItem.name}${order.items.length > 1 ? ` (+${order.items.length - 1})` : ''}`
    const quantity = order.items.reduce((acc, item) => acc + item.quantity, 0)
    lines.push(
      `${order.id.padEnd(18)} ${order.status.padEnd(13)} ${itemLabel.padEnd(28)} ${String(quantity).padEnd(4)} ${
        money(order.total?.amount, order.total?.currency)
      }`,
    )
  }
  return lines.join('\n')
}

export function renderShipment(shipment: Shipment): string {
  const status = shipment.status
  const events = shipment.events[0]
  const last = events === undefined ? '-' : events.description
  return [
    '',
    `## Shipment — ${shipment.id}`,
    `  Status       : ${status}`,
    `  Tracking     : ${shipment.trackingNumber} (${shipment.carrier})`,
    `  Order        : ${shipment.orderId}`,
    `  Item         : ${shipment.items.map((item) => `${item.sku} ×${item.quantity}`).join(', ')}`,
    `  Event terakhir: ${last}`,
  ].join('\n')
}

/** Deret badge capability (rendering berbasis capability yang mau dipakai UI). */
export function renderCapabilities(platform: string, capabilities: readonly string[]): string {
  const badges = capabilities.length === 0 ? '(kosong)' : capabilities.map((cap) => `[${cap}]`).join(' ')
  return `${platform.padEnd(10)} → ${badges}`
}

/** Event webhook ternormalisasi (Fase 9) utk ditampilkan smoke test. */
export function renderWebhookEvents(platform: string, events: readonly WebhookOrderEvent[]): string {
  if (events.length === 0) {
    return `  ${platform}: payload bukan event order (dilewati)`
  }
  const lines: string[] = events.map((event) => {
    const previous = event.kind === 'order.status_changed' && event.previousStatus !== undefined
      ? ` (prev: ${event.previousStatus})`
      : ''
    return (
      `  [${event.kind}] orderId=${event.orderId} platformOrderId=${event.platformOrderId} ` +
      `status=${event.status}${previous} at=${event.occurredAt} eventId=${event.eventId}`
    )
  })
  return [`  ${platform} → ${events.length} event(s)`, ...lines].join('\n')
}
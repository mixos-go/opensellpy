import { OmniClient, supports } from '@mixos-go/opensellpy-client'
import type { DomainKey } from '@mixos-go/opensellpy-core'
import { createMockShopeeAdapter, createMockTtsAdapter } from '@mixos-go/opensellpy-testing'
import { renderCapabilities, renderOrders, renderShipment } from './render.js'
import { runWebhookDemo } from './webhook-demo.js'

/**
 * Fitur yang dikenali UI. Core punya 5 domain; fitur lain (promotion, finance,
 * chat) TIDAK ada di core dan hanya dipakai bila ada di `capabilities` adapter
 * (pola dari diskusi arsitektur) — lihat param bahasan `extra/`.
 */
type ExtendedFeature = DomainKey | 'promotion' | 'finance' | 'chat'

const FEATURE_LABELS: Record<ExtendedFeature, string> = {
  order: 'Order',
  product: 'Produk',
  category: 'Kategori',
  inventory: 'Stok',
  logistics: 'Logistik',
  promotion: 'Promosi',
  finance: 'Finance',
  chat: 'Chat',
}

const FEATURE_BADGES: readonly ExtendedFeature[] = [
  'order',
  'product',
  'category',
  'inventory',
  'logistics',
  'promotion',
  'finance',
  'chat',
]

/** Render capability UI + jalankan aksi per domain yang didukung adapter. */
async function demoPlatform(adapter: ReturnType<typeof createMockShopeeAdapter>): Promise<string[]> {
  const lines: string[] = []
  const platform = adapter.platform
  const features = adapter.capabilities as readonly ExtendedFeature[]

  // Baris capability: badge hanya utk fitur yang benar-benar disupport.
  const visible = FEATURE_BADGES.filter((feature) => features.includes(feature)).map(
    (feature) => FEATURE_LABELS[feature],
  )
  lines.push(renderCapabilities(platform, visible))

  // Order — selalu ada di core. Limit besar biar seluruh seed mock terlihat
  // (Order/Logistik contoh butuh order dgn beragam status).
  const result = await adapter.order.listOrders({ page: 1, limit: 10 })
  lines.push(renderOrders(platform, result.items))

  // Pola capability-based dari diskusi arsitektur: fitur NON-core (promotion)
  // hanya dirender bila ada di capabilities — di mock adapter tidak, jadi UI
  // menyembunyikan menu promosi tanpa error.
  if (features.includes('promotion')) {
    lines.push(`  PROMO: modul promosi tersedia di ${platform}`)
  } else {
    lines.push(`  PROMO: modul promosi TIDAK aktif di ${platform} — menu disembunyikan`)
  }

  // Inventory (core) — contoh penggunaan helper `supports` dari @mixos-go/opensellpy-client.
  if (supports(adapter, 'inventory')) {
    const firstOrder = result.items[0]
    const sku = firstOrder?.items[0]?.sku
    if (sku !== undefined) {
      const stock = await adapter.inventory.getStock(sku)
      lines.push(`  STOK ${sku} → ${stock.quantity} unit @ ${stock.warehouseId ?? '-'} (${platform})`)
    }
  }

  // Logistics (core) — buat shipment utk order ready-to-ship pertama.
  if (adapter.capabilities.includes('logistics')) {
    const ready = result.items.find((order) => order.status === 'ready-to-ship')
    if (ready !== undefined) {
      const shipment = await adapter.logistics.createShipment({ orderId: ready.id })
      lines.push(renderShipment(shipment))
    }
  }

  // mutasi status utk membuktikan data tersisa di backend mock (smoke E2E).
  const pending = result.items.find((order) => order.status === 'pending')
  if (pending !== undefined) {
    const updated = await adapter.order.updateOrderStatus(pending.id, 'shipped')
    lines.push(`  UPDATE ${platform}: order ${pending.id} pending → ${updated.status} (item: ${updated.items[0]?.status ?? '-'})`)
  }

  return ['', `=== ${platform} ===`, ...lines]
}

/** Jalankan seluruh skenario smoke consumer. */
export async function runDemo(): Promise<void> {
  const client = new OmniClient()
  const shopee = createMockShopeeAdapter()
  const tts = createMockTtsAdapter()
  client.register(shopee)
  client.register(tts)

  const output: string[] = ['OpenSellPy — example consumer / smoke test', 'Registered: shopee (mock), tts (mock)']
  output.push(...(await demoPlatform(shopee)))
  output.push(...(await demoPlatform(tts)))
  output.push(await runWebhookDemo())
  console.log(output.join('\n'))
}
# OpenSellPy — Omnichannel SDK

Monorepo SDK omnichannel untuk **multi-seller marketplace hub** (backend-only). Menyatukan akses
ke beberapa marketplace (Shopee, TikTok Shop, Lazada, Blibli) lewat kontrak domain yang seragam.

> Frontend/dashboard akan dibuat di repo terpisah. Repo ini murni backend SDK.

## Struktur

```
opensellpy/
├── packages/
│   ├── core/          @opensellpy/core      — kontrak domain (jenis + interface), bebas platform
│   ├── client/        @opensellpy/client    — orchestrator/registry adapter
│   ├── adapters/
│   │   ├── shopee/    @opensellpy/adapter-shopee
│   │   ├── tts/       @opensellpy/adapter-tts        (TikTok Shop, pasca-merger Tokopedia)
│   │   ├── lazada/    @opensellpy/adapter-lazada
│   │   └── blibli/    @opensellpy/adapter-blibli
│   └── testing/       @opensellpy/testing    — fixtures + mock adapters
└── apps/
    └── example/       consumer contoh / smoke test
```

## Mulai cepat

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Contoh penggunaan (consumer)

Register adapter (di sini mock dari `@opensellpy/testing` — offine, tanpa kredensial), lalu
arahkan call ke domain contract yang seragam lintas platform:

```ts
import { OmniClient } from '@opensellpy/client'
import { createMockShopeeAdapter, createMockTtsAdapter } from '@opensellpy/testing'

const client = new OmniClient()
client.register(createMockShopeeAdapter())
client.register(createMockTtsAdapter())

const orders = await client.platform('shopee').order.listOrders({ page: 1, limit: 10 })

// capability-based UI: fitur dirender hanya bila ada di `capabilities` adapter.
if (client.platform('tts').capabilities.includes('inventory')) {
  const firstOrder = orders.items[0]
  const sku = firstOrder?.items[0]?.sku
  if (sku !== undefined) {
    const stock = await client.platform('tts').inventory.getStock(sku)
    console.log(`Stok ${sku}: ${stock.quantity} unit`)
  }
}
```

Smoke test end-to-end (menjalankan skenario di `apps/example`):

```bash
pnpm --filter @opensellpy/example start
```

Webhook order-status: setiap adapter mengekspos `adapter.webhook` — verify signature lalu parse
jadi `WebhookOrderEvent[]` (`order.created` / `order.status_changed`). Contoh payload + skema
verifikasi tiap platform: `docs/webhook-payload-samples/`.

## Dokumen

- `docs/ARCHITECTURE.md` — sumber kebenaran struktur & aturan
- `docs/ADDING_A_DOMAIN.md` — cara nambah domain universal
- `docs/ADDING_A_PLATFORM.md` — cara nambah platform adapter
- `docs/CAPABILITY_MATRIX.md` — matriks capability per platform
- `AGENTS.md` — panduan kerja agent
- `TODO.md` — fase & task terurut

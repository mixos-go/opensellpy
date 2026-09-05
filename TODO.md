# TODO — Omnichannel SDK

Urutan fase wajib diikuti (fase N butuh fase N-1 selesai). Dalam satu fase, task boleh dikerjakan
paralel oleh beberapa agent selama tidak menyentuh file yang sama. Setiap task = 1 PR.

Status: `[ ]` belum, `[~]` in progress (tandai dengan nama agent/branch), `[x]` selesai & merged.

---

## Fase 0 — Scaffold repo

- [x] Init pnpm workspace + turborepo (`pnpm-workspace.yaml`, `turbo.json`)
- [x] `tsconfig.base.json` sesuai `docs/ARCHITECTURE.md` §8
- [x] `eslint.config.mjs` + rule `no-restricted-imports` per arah dependency (§8)
- [x] Setup `.changeset` untuk versioning independen per package
- [x] `.github/workflows/ci.yml`: run `typecheck`, `lint`, `test` di semua package tiap PR
- [x] Buat skeleton kosong: `packages/core`, `packages/client`, `packages/adapters/{shopee,tts,lazada,blibli}`, `packages/testing`, `apps/example` — masing-masing cuma `package.json` + `tsconfig.json` + `src/index.ts` kosong
- [x] `docs/ADDING_A_DOMAIN.md` — expand dari ringkasan di `AGENTS.md` §2
- [x] `docs/ADDING_A_PLATFORM.md` — expand dari ringkasan di `AGENTS.md` §4
- [x] `docs/CAPABILITY_MATRIX.md` — tabel kosong, kolom = 4 platform, baris = domain

## Fase 1 — Core: shared + errors + platform types

Urutan wajib duluan karena semua domain depend ke sini.

- [x] `core/src/shared/money.ts`, `pagination.ts`
- [x] `core/src/errors/platform.error.ts` (base class) + `auth.error.ts`, `rate-limit.error.ts`,
      `not-found.error.ts`, `validation.error.ts`, `index.ts`
- [x] `core/src/platform/platform-key.ts` — union `'shopee' | 'tts' | 'lazada' | 'blibli'`
- [x] `core/src/platform/domain-key.ts` — union domain awal: `'order' | 'product' | 'category' |
      'inventory' | 'logistics'` (mulai dari 5 domain yang ada di semua platform, sesuai
      capability matrix diskusi awal)
- [x] `core/src/platform/platform-adapter.ts` — interface `PlatformAdapter<Extra = unknown>`
- [x] `core/src/events/event.types.ts` — base `DomainEvent<T>`

## Fase 2 — Core: domain contracts (5 domain prioritas)

Masing-masing bisa dikerjakan paralel oleh agent berbeda — tidak saling depend, hanya depend ke
Fase 1.

- [x] `core/src/domains/order/` — `Order`, `OrderItem`, `OrderStatus`, `ListOrdersParams`,
      `IOrderProvider` (listOrders, getOrder, updateOrderStatus)
- [x] `core/src/domains/product/` — `Product`, `ProductVariant`, `IProductProvider`
      (listProducts, getProduct, createProduct, updateProduct, updateStock-nya ke inventory bukan
      sini)
- [x] `core/src/domains/category/` — `Category` (tree), `ICategoryProvider` (getCategoryTree,
      getCategoryAttributes)
- [x] `core/src/domains/inventory/` — `StockLevel`, `Warehouse`, `IInventoryProvider`
      (getStock, updateStock)
- [x] `core/src/domains/logistics/` — `Shipment`, `TrackingEvent`, `ILogisticsProvider`
      (createShipment, getTracking, cancelShipment)
- [x] `core/src/events/order.events.ts` — `OrderCreatedEvent`, `OrderStatusChangedEvent`
- [x] `core/src/index.ts` — barrel export final, review manual field mana yang perlu public

## Fase 3 — Client orchestrator

Depend ke Fase 1 + 2 selesai.

- [x] `client/src/plugin-registry.ts` — `Map<PlatformKey, PlatformAdapter>`, method
      `register`/`get`/`has`
- [x] `client/src/omni-client.ts` — class `OmniClient`, method `.platform(key)`
- [x] `client/src/capability.ts` — `getCapabilities(platform)`, `supports(platform, domain)`
- [x] Unit test `OmniClient` pakai adapter dummy inline (belum butuh mock-adapters package)

## Fase 4 — Adapter Shopee (platform prioritas pertama)

Depend ke Fase 1 + 2. **Prasyarat eksternal:** connector `@mixos-go/shopee-sdk` (contract seragam:
`createShopeeConnector` + `TokenStore` + multi-seller) harus sudah rilis — ikuti `TODO.md` di repo
`mixos-go/shopee`. Domain dikerjakan berurutan sesuai prioritas (order dulu, baru boleh paralel
yang lain).

- [x] `adapters/shopee/src/config.ts` + `client/shopee.factory.ts` — instantiate connector
      `createShopeeConnector(config)` dari `@mixos-go/shopee-sdk` (contract `TokenStore` seragam +
      multi-seller). Adapter memakai `TokenStore` (mis. dari backend opensellpy) + `getClient(shopId)`.
      OAuth/token refresh TIDAK dikelola di sini.
- [x] `adapters/shopee/src/errors/shopee-error.mapper.ts`
- [x] `adapters/shopee/src/domains/order/` — provider + mapper + params-mapper + status-map
- [x] `adapters/shopee/src/domains/product/`
- [x] `adapters/shopee/src/domains/category/`
- [x] `adapters/shopee/src/domains/inventory/`
- [x] `adapters/shopee/src/domains/logistics/`
- [x] `adapters/shopee/src/capabilities.ts` — isi HANYA domain yang sudah selesai + test
- [x] `adapters/shopee/src/index.ts` — `createShopeeAdapter(config)`
- [x] Unit test tiap mapper: kasus data lengkap + kasus field opsional kosong

## Fase 5 — Adapter TTS (TikTok Shop, pasca-merger Tokopedia)

Pola identik Fase 4, ganti target jadi `tts` (package `@opensellpy/adapter-tts`, konsumsi
connector `@mixos-go/tiktok-shop-sdk`). Bisa mulai paralel begitu Fase 4 struktur
providernya sudah jadi referensi (tidak perlu nunggu Fase 4 100% selesai, cukup domain order-nya
selesai sebagai referensi pola).

- [x] `adapters/tts/src/config.ts` + `adapters/tts/src/client/tts.factory.ts` — instantiate connector
      `createTikTokShopConnector(config)` dari `@mixos-go/tiktok-shop-sdk` (contract `TokenStore`
      seragam + multi-seller). Adapter memakai `TokenStore` + `getClient(shopId)`.
      OAuth/token refresh TIDAK dikelola di sini.
- [x] `adapters/tts/src/errors/tiktok-error.mapper.ts`
- [x] `adapters/tts/src/domains/order/` — provider + mapper + params-mapper + status-map
- [x] `adapters/tts/src/domains/product/`
- [x] `adapters/tts/src/domains/category/`
- [x] `adapters/tts/src/domains/inventory/`
- [x] `adapters/tts/src/domains/logistics/`
- [x] `adapters/tts/src/capabilities.ts` — isi HANYA domain yang sudah selesai + test
- [x] `adapters/tts/src/index.ts` — `createTtsAdapter(config)`
- [x] Unit test tiap mapper: kasus data lengkap + kasus field opsional kosong

## Fase 6 — Adapter Lazada

Pola identik Fase 4/5, konsumsi connector `@mixos-go/lazada-sdk`. Access token Lazada terikat region;
pastikan `region` per connector benar (default `singapore`, Indonesia = `indonesia`).

- [x] `adapters/lazada/src/config.ts` + `adapters/lazada/src/client/lazada.factory.ts` — instantiate
      connector `createLazadaConnector(config)` dari `@mixos-go/lazada-sdk` (contract `TokenStore`
      seragam + multi-seller). Adapter memakai `TokenStore` + `getClient(shopId)`.
      OAuth/token refresh TIDAK dikelola di sini.
- [x] `adapters/lazada/src/errors/lazada-error.mapper.ts`
- [x] `adapters/lazada/src/domains/order/` — provider + mapper + params-mapper + status-map
- [x] `adapters/lazada/src/domains/product/`
- [x] `adapters/lazada/src/domains/category/`
- [x] `adapters/lazada/src/domains/inventory/`
- [x] `adapters/lazada/src/domains/logistics/`
- [x] `adapters/lazada/src/capabilities.ts` — isi HANYA domain yang sudah selesai + test
- [x] `adapters/lazada/src/index.ts` — `createLazadaAdapter(config)`
- [x] Unit test tiap mapper: kasus data lengkap + kasus field opsional kosong

## Fase 7 — Adapter Blibli

- [x] `adapters/blibli/src/config.ts` + `adapters/blibli/src/client/blibli.factory.ts` — instantiate
      connector `createBlibliConnector(config)` dari `@mixos-go/bli-bli-sdk` (contract `TokenStore`
      seragam + multi-seller). Blibli tanpa OAuth: registrasi shop = `connect(shopId, apiSellerKey)`
      (dipanggil eager di constructor); `redirectUri` dipertahankan untuk kontrak seragam.
- [x] `adapters/blibli/src/errors/blibli-error.mapper.ts`
- [x] `adapters/blibli/src/client/request.ts` — `callRaw`/`callEnvelope`/`assertOk`: buka envelope
      `{requestId, content}|{success, value}`, deteksi error `{success:false, errorCode, errorMessage}`
      (client SDK tidak throw pada envelope error), 204 → null
- [x] `adapters/blibli/src/domains/order/` — provider + mapper + params-mapper + status-map
      (spec custom: Order List V2 / Order Detail V2 / Fulfill Regular V2)
- [x] `adapters/blibli/src/domains/product/` (spec custom: Product List V3 via path benar
      `/seller/v1/products/filter`, Product Detail V2, Create Product V3 async, archive/unarchive,
      Update Product Detail V2)
- [x] `adapters/blibli/src/domains/category/` (Category Tree V1 mtaapi + Category Attributes V2)
- [x] `adapters/blibli/src/domains/inventory/` (getStock agregat `counter.stock`; updateStock perlu
      blibliSku — resolve via Product Variant Pickup Point List V1; warehouse = pickup point)
- [x] `adapters/blibli/src/domains/logistics/` (createShipment = pack+fulfill; getTracking via
      Order List V2 filter packageId + Order Detail V2; cancelShipment → ValidationError)
- [x] `adapters/blibli/src/capabilities.ts` — isi HANYA domain yang sudah selesai + test
- [x] `adapters/blibli/src/index.ts` — `createBlibliAdapter(config)`
- [x] Unit test tiap mapper + status-map + params-mapper + client/request wrapper
- [x] Catat di `docs/CAPABILITY_MATRIX.md` domain mana yang memang tidak tersedia di Blibli
      (jangan dipaksa implement kalau API-nya memang tidak ada)

## Fase 8 — Testing package

Depend ke minimal 1 adapter selesai (Fase 4) supaya tahu bentuk kontraknya konkret.

- [ ] `testing/src/fixtures/order.fixture.ts`, `product.fixture.ts`, dst — factory function
      `build<Domain>(overrides?)`
- [ ] `testing/src/mock-adapters/mock-shopee.adapter.ts` — implement `PlatformAdapter` pakai
      fixture, tanpa depend ke `@mixos-go/*-sdk`
- [ ] `testing/src/mock-adapters/mock-tts.adapter.ts`
- [ ] `testing/src/mock-adapters/mock-lazada.adapter.ts`
- [ ] `testing/src/mock-adapters/mock-blibli.adapter.ts`

## Fase 9 — Webhook / event normalization

- [ ] Desain `IWebhookHandler` contract di `core` (belum ada di Fase 1/2 — perlu riset dulu
      bentuk payload webhook tiap platform sebelum finalisasi kontrak, taruh sebagai task riset
      terpisah sebelum implement)
- [ ] Riset: kumpulkan contoh payload webhook order-status-changed dari 4 platform, taruh di
      `docs/webhook-payload-samples/`
- [ ] Implement `order.webhook-mapper.ts` per adapter setelah kontrak final

## Fase 10 — apps/example (consumer contoh)

- [ ] Setup consumer app minimal: register 2 adapter, list order, render capability-based UI
      (contoh kongkret pola `if (caps.includes('promotion')) ...` dari diskusi arsitektur)
- [ ] Jadi acuan manual smoke test tiap kali ada release

## Fase 11 — Release & docs finalisasi

- [ ] Review ulang seluruh `docs/CAPABILITY_MATRIX.md` — pastikan sinkron sama capabilities.ts
      tiap adapter
- [ ] `README.md` root — quickstart pakai contoh dari `apps/example`
- [ ] First release lewat changeset ke npm untuk semua package

---

## Catatan prioritas domain (hasil diskusi)

Domain yang masuk `core` di Fase 2 dipilih dari yang overlap di ke-4 platform: **order, product,
category, inventory, logistics**. Domain lain (promotion, finance, chat, review, dan semua
spesifik-platform seperti live streaming/ads/coins) **sengaja belum masuk TODO** — akan dibuka
sebagai task baru begitu ada kebutuhan konkret, ikuti alur `AGENTS.md` §2/§3 (mulai dari `extra/`
platform tunggal, naik ke `core` kalau sudah dipakai ≥2 platform).

> Penting: pindahnya OAuth/connector/API dasar ke repo SDK marketplace (`@mixos-go/*-sdk`) membuat
> implementasi per-platform lebih ringkas, tapi **tidak** otomatis membuat semua domain "masuk core".
> Kriteria masuk `core` tetap = semantik sama lintas **≥2 platform**. "SDK-nya sudah meng-cover
> endpoint" ≠ universal. 5 domain di atas tetap inti; sisanya ditahan sampai ada kebutuhan konkret.

---

## Koordinasi dengan repo SDK marketplace

Connector/OAuth (contract seragam `TokenStore` + multi-seller) dikerjakan di repo SDK masing-masing,
BUKAN di repo ini. TODO penerapannya ada di:

- `mixos-go/shopee` → `TODO.md`
- `mixos-go/tiktok-shop` → `TODO.md`
- `mixos-go/lazada` → `TODO.md`
- `mixos-go/bli-bli` → `TODO.md`

**Kontrak seragam connector** (identik di 4 repo): `connector/{types,token-store,connector,index}.ts`,
`TokenSet`, `TokenStore { get/set/delete }`, `<Platform>Connector` multi-seller
(`buildAuthUrl(shopId)`, `handleCallback(shopId,code)`, `refresh(shopId)`, `getClient(shopId)`,
`listShopIds()`), `create<Platform>Connector(config)`.

Urutan kerja (sudah disepakati):
1. skeleton opensellpy (✅ Fase 0)
2. TODO di tiap repo SDK marketplace (✅ sudah dipush ke 4 repo)
3. kerjakan TODO opensellpy (Fase 1+ — mulai di sini)
4. kerjakan TODO masing-masing SDK marketplace (kapan saja, paralel; prasyarat utk Fase 4-7
   adapter opensellpy)
# @mixos-go/opensellpy-adapter-tts

## 1.0.4

### Patch Changes

- Publish npm sebagai package PUBLIC di GitHub Packages (publishConfig.access) agar mudah dipakai lintas team
- Updated dependencies
  - @mixos-go/opensellpy-core@0.1.2

## 1.0.3

### Patch Changes

- fix(tts): inventory live-shape TikTok — stok per-warehouse

  - `getStock`/`updateStock` (findSku): setelah SKU ter-fill di produk sandbox terverifikasi live,
    `fromTiktokStockLevel` baca `skus[].inventory[].quantity` (agregat lintas warehouse),
    bukan field `quantity` yang tidak pernah ada → sebelumnya selalu 0.
  - `updateStock`: body `/product/202309/products/{id}/inventory/update` sekarang
    `skus:[{ id, inventory:[{ warehouse_id, quantity }] }]` (wajib ada blok `inventory`;
    tanpa itu API menolak "Inventory of Skus[0] is required"). Default warehouse = warehouse
    tempat stok SKU berada (`inventory[0].warehouse_id`), bukan warehouse pertama dari list
    (Return warehouse ditolak API utk inventori).
  - Terverifikasi live sandbox: getStock 1000 → updateStock(5) → getStock 5 (write+read roundtrip).

## 1.0.2

### Patch Changes

- fix(tts): parsing product detail flat — GET `/product/202309/products/{product_id}` balikin `data` LANGSUNG product (bukan `{product}`), terverifikasi live sandbox. `product.getProduct` & `inventory.getStock`/`updateStock` (findSku) sebelumnya menganggap ada wrapper `product:` → NotFoundError walaupun data ada. Deps `@mixos-go/tiktok-shop-sdk` naik ke `^1.2.0` (OAuth v2 host + sign atas final path utk path-param API).

## 1.0.1

### Patch Changes

- Fix window waktu 15-hari tersembunyi (temuan uji live): ListProductsParams & ListOrdersParams kini menerima `updatedFrom`/`updatedTo` (epoch detik, opsional).

  - Product: default TIDAK lagi mengirim window waktu (item lama ikut terlihat). shopee → update_time_from/to, tts → create_time_ge/le, lazada → create_after (create_before tidak didukung, diabaikan).
  - Order: default window 15 hari tetap (Shopee wajib, tts/lazada batas aman) tapi bisa di-narrow via updatedFrom/updatedTo. shopee → time_from/time_to, tts → create_time_ge/lt, lazada → created_after/created_before.

- Updated dependencies
  - @mixos-go/opensellpy-core@0.1.1

## 1.0.0

### Minor Changes

- Initial release OpenSellPy:

  - `@mixos-go/opensellpy-core` — kontrak domain (order/product/category/inventory/logistics),
    error, events, webhook (`IWebhookHandler` + helper signature), without platform variance
  - `@mixos-go/opensellpy-client` — `OmniClient` registry + capability helpers
  - `@mixos-go/opensellpy-adapter-{shopee,tts,lazada,blibli}` — provider 5 domain via
    `@mixos-go/*-sdk` connector + webhook handler
  - `@mixos-go/opensellpy-testing` — fixtures `build<Domain>(overrides?)` + 4 mock adapters
  - `@mixos-go/opensellpy-example` — consumer contoh & smoke test manual

### Patch Changes

- Updated dependencies
  - @mixos-go/opensellpy-core@0.1.0

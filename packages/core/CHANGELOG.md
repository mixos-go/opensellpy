# @mixos-go/opensellpy-core

## 0.1.1

### Patch Changes

- Fix window waktu 15-hari tersembunyi (temuan uji live): ListProductsParams & ListOrdersParams kini menerima `updatedFrom`/`updatedTo` (epoch detik, opsional).

  - Product: default TIDAK lagi mengirim window waktu (item lama ikut terlihat). shopee → update_time_from/to, tts → create_time_ge/le, lazada → create_after (create_before tidak didukung, diabaikan).
  - Order: default window 15 hari tetap (Shopee wajib, tts/lazada batas aman) tapi bisa di-narrow via updatedFrom/updatedTo. shopee → time_from/time_to, tts → create_time_ge/lt, lazada → created_after/created_before.

## 0.1.0

### Minor Changes

- Initial release OpenSellPy:

  - `@mixos-go/opensellpy-core` — kontrak domain (order/product/category/inventory/logistics),
    error, events, webhook (`IWebhookHandler` + helper signature), without platform variance
  - `@mixos-go/opensellpy-client` — `OmniClient` registry + capability helpers
  - `@mixos-go/opensellpy-adapter-{shopee,tts,lazada,blibli}` — provider 5 domain via
    `@mixos-go/*-sdk` connector + webhook handler
  - `@mixos-go/opensellpy-testing` — fixtures `build<Domain>(overrides?)` + 4 mock adapters
  - `@mixos-go/opensellpy-example` — consumer contoh & smoke test manual

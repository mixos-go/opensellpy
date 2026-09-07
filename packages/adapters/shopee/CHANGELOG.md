# @mixos-go/opensellpy-adapter-shopee

## 1.0.1

### Patch Changes

- Fix uji live sandbox: get_order_list/detail kini mengirim `response_optional_fields` yang benar (list tanpa item_list/total_amount karena sandbox menolaknya; detail lengkap) sehingga total/items/alamat ter-populate.

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

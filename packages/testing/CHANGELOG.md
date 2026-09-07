# @mixos-go/opensellpy-testing

## 0.1.1

### Patch Changes

- Updated dependencies
  - @mixos-go/opensellpy-core@0.1.1
  - @mixos-go/opensellpy-client@0.1.1

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

### Patch Changes

- Updated dependencies
  - @mixos-go/opensellpy-core@0.1.0
  - @mixos-go/opensellpy-client@0.1.0

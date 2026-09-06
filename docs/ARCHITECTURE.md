# Architecture — Omnichannel SDK

Dokumen ini adalah **sumber kebenaran** untuk struktur project, naming convention, dan aturan tiap
folder. Kalau ada perbedaan antara kode yang sudah ada dan dokumen ini, dokumen ini yang benar —
kode harus disesuaikan, bukan sebaliknya.

## 1. Prinsip inti

1. **Satu arah dependency.** `core` tidak boleh tahu apa pun soal platform manapun. `adapter-*`
   boleh depend ke `core` + raw SDK platformnya sendiri. `client` cuma boleh depend ke `core`.
   `apps/*` (consumer) boleh depend ke `client` + adapter mana pun yang dia pakai.
2. **Domain-first, bukan platform-first.** Kontrak (`interface`) dan tipe data hidup di `core`,
   dikelompokkan per domain bisnis (order, product, category, dst) — bukan per platform.
3. **Additive by default.** Nambah domain baru, atau nambah platform baru, tidak boleh mengubah
   file yang sudah ada di domain/platform lain. Kalau sebuah task "terpaksa" mengubah banyak file
   di luar domain/platform yang sedang dikerjakan, itu sinyal ada yang salah di desain.
4. **Explicit over implicit.** Tidak ada `any`, tidak ada magic string tersebar, tidak ada barrel
   file yang re-export semuanya tanpa kontrol.
5. **Raw data selalu ada, dinormalisasi tidak menghapus.** Field `raw` disimpan di setiap domain
   type supaya tidak ada data yang hilang saat mapping, dan supaya ada jalan darurat.

## 2. Struktur monorepo (pnpm workspace + turborepo)

```
opensellpy/
├── AGENTS.md
├── TODO.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.mjs
├── .changeset/
├── docs/
│   ├── ARCHITECTURE.md          <- dokumen ini
│   ├── ADDING_A_DOMAIN.md
│   ├── ADDING_A_PLATFORM.md
│   └── CAPABILITY_MATRIX.md
├── packages/
│   ├── core/                    @mixos-go/opensellpy-core
│   ├── client/                  @mixos-go/opensellpy-client
│   ├── adapters/
│   │   ├── shopee/              @mixos-go/opensellpy-adapter-shopee
│   │   ├── tts/                  @mixos-go/opensellpy-adapter-tts
│   │   ├── lazada/              @mixos-go/opensellpy-adapter-lazada
│   │   └── blibli/              @mixos-go/opensellpy-adapter-blibli
│   └── testing/                 @mixos-go/opensellpy-testing
└── apps/
    └── example/                 <- consumer app contoh / smoke test manual
```

Kenapa `packages/adapters/<platform>/` (bukan `packages/adapter-shopee/` rata di root
`packages/`): supaya saat nambah platform ke-5, ke-6, dst, foldernya ngumpul jadi satu registry
visual, bukan nyampur sama `core`/`client`/`testing`. Ini juga yang lo maksud di pertanyaan —
`adapters/` jadi satu tempat, isinya folder per platform.

## 3. `packages/core` — detail

```
packages/core/src/
├── domains/
│   ├── order/
│   │   ├── order.types.ts        <- Order, OrderItem, OrderStatus, ListOrdersParams
│   │   ├── order.contract.ts     <- interface IOrderProvider
│   │   └── index.ts              <- re-export dari 2 file di atas, TIDAK ADA LOGIC
│   ├── product/
│   │   ├── product.types.ts
│   │   ├── product.contract.ts
│   │   └── index.ts
│   ├── category/
│   ├── inventory/
│   ├── logistics/
│   ├── promotion/
│   ├── finance/
│   ├── chat/
│   └── review/
├── platform/
│   ├── platform-key.ts           <- type PlatformKey = 'shopee' | 'tts' | 'lazada' | 'blibli'
│   ├── domain-key.ts              <- type DomainKey = 'order' | 'product' | ...
│   └── platform-adapter.ts        <- interface PlatformAdapter<Extra = unknown>
├── errors/
│   ├── platform.error.ts          <- abstract base class PlatformError
│   ├── auth.error.ts              <- class PlatformAuthError extends PlatformError
│   ├── rate-limit.error.ts        <- class RateLimitError extends PlatformError
│   ├── not-found.error.ts         <- class NotFoundError extends PlatformError
│   ├── validation.error.ts        <- class ValidationError extends PlatformError
│   └── index.ts
├── events/
│   ├── event.types.ts             <- interface DomainEvent<T>, EventName union
│   ├── order.events.ts            <- OrderCreatedEvent, OrderStatusChangedEvent
│   └── index.ts
├── shared/
│   ├── money.ts                   <- type Money = { amount: number; currency: string }
│   ├── pagination.ts              <- PaginatedResult<T>, PaginationParams
│   └── result.ts                  <- (opsional) Result<T, E> pattern kalau mau hindari throw
└── index.ts                       <- PUBLIC API package ini, lihat aturan barrel di bawah
```

**Aturan folder `domains/<nama>/`:**
- 1 domain = 1 folder, isinya minimal `*.types.ts` + `*.contract.ts` + `index.ts`.
- `*.types.ts` isinya `interface`/`type` data (noun), tidak ada `interface` yang isinya method.
- `*.contract.ts` isinya `interface` yang isinya method saja (verb), prefix wajib `I`
  (`IOrderProvider`, bukan `OrderProvider`).
- Tidak ada implementasi logic apa pun di `core`. Kalau ada function dengan `{ ... }` isi logic
  bisnis (bukan cuma type helper murni), itu salah tempat — harusnya di adapter.
- Domain baru **tidak boleh** import dari domain lain kecuali lewat `shared/`. Kalau `order`
  butuh `Money` dari `product`, pindahin `Money` ke `shared/`.

**Aturan `errors/`:** semua error class extends `PlatformError` (base class di
`platform.error.ts`), dan wajib punya field `platform: PlatformKey` dan `cause?: unknown` supaya
error asli dari SDK platform tidak hilang (selalu attach lewat `cause`).

**Aturan barrel `index.ts` di root `core/src/index.ts`:** hanya re-export yang memang jadi
public API (dipakai `client` dan `adapter-*`). Internal helper yang cuma dipakai antar file di
`core` sendiri tidak usah diekspos di sini.

## 4. `packages/client` — detail

```
packages/client/src/
├── omni-client.ts     <- class OmniClient (registry + facade)
├── plugin-registry.ts         <- Map<PlatformKey, PlatformAdapter> + method register/get
├── capability.ts               <- helper getCapabilities(), supports()
└── index.ts
```

`client` tidak pernah `import` dari `packages/adapters/*` secara statis. Adapter selalu
di-`register()` dari luar (dependency injection), supaya consumer app bisa pilih platform mana
saja yang mau di-bundle — tidak wajib install semua 4 adapter kalau cuma butuh 2.

## 5. `packages/adapters/<platform>/` — detail

Contoh `packages/adapters/shopee/`, pola yang sama berlaku untuk `tts`, `lazada`,
`blibli`:

```
packages/adapters/shopee/src/
├── domains/
│   ├── order/
│   │   ├── order.provider.ts         <- implements IOrderProvider, HANYA orchestration
│   │   ├── order.mapper.ts            <- raw platform response -> domain type
│   │   ├── order.params-mapper.ts     <- domain params -> raw platform request params
│   │   └── order.status-map.ts        <- Record<RawStatus, OrderStatus>, dipisah dari mapper
│   ├── product/
│   ├── category/
│   ├── inventory/
│   └── logistics/
│   (hanya domain yang capabilities-nya true, lihat aturan di bawah)
├── extra/                              <- domain KHUSUS Shopee, tidak ada di core
│   ├── live/
│   ├── ads/
│   └── coins/
├── client/
│   └── shopee.factory.ts            <- instantiate+konfigurasi connector dari @mixos-go/shopee-sdk
│                                        (OAuth/connector lifecycle ada di repo SDK tsb, bukan di sini)
├── errors/
│   └── shopee-error.mapper.ts           <- raw error Shopee -> PlatformError subclasses di core
├── config.ts                            <- ShopeeConfig type + validasi
├── capabilities.ts                       <- const SHOPEE_CAPABILITIES: DomainKey[]
└── index.ts                              <- export function createShopeeAdapter(config)
```

**Aturan penting per file:**
- `*.provider.ts` **tidak boleh** ada transformasi data manual di dalamnya — dia cuma:
  panggil raw SDK → lempar ke `*.mapper.ts` → tangkap error → lempar ke `*-error.mapper.ts`.
  Kalau providernya mulai punya banyak `if/else` transformasi data, pindahin ke mapper.
- `*.mapper.ts` isinya pure function `(raw) => domainType`, tidak boleh ada network call di
  dalamnya, dan tidak boleh throw — kalau data tidak lengkap, isi dengan default yang aman lalu
  simpan raw-nya, atau lempar `ValidationError` yang jelas.
- `*.status-map.ts` dipisah dari mapper supaya gampang di-review saat platform update status
  code-nya — reviewer cukup lihat 1 file kecil, bukan seluruh mapper.
- `extra/` HANYA untuk domain yang tidak punya padanan lintas platform (lihat
  `docs/ADDING_A_DOMAIN.md`). Kalau ternyata platform lain juga butuh domain yang sama, domain
  itu "naik kelas" pindah ke `core` — bukan didiamkan dobel di `extra/` masing-masing adapter.
- Package `package.json` adapter **wajib** `dependencies: { "@mixos-go/shopee-sdk": "^x" }` dan
  `peerDependencies: { "@mixos-go/opensellpy-core": "^x" }`. Tidak boleh depend ke adapter platform
  lain, tidak boleh depend ke `client`. OAuth/connector (connect URL, exchange code, auto-refresh
  token) TIDAK diimplement di adapter opensellpy — semua itu hidup di repo SDK marketplace
  (`@mixos-go/*-sdk`) via satu pattern/contract seragam (lihat §11). Adapter opensellpy cukup
  mengkonsumsi connector tersebut lalu memetakan hasilnya ke kontrak domain `core`.

## 6. `packages/testing`

```
packages/testing/src/
├── mock-adapters/
│   ├── mock-shopee.adapter.ts
│   ├── mock-tts.adapter.ts
│   ├── mock-lazada.adapter.ts
│   └── mock-blibli.adapter.ts
├── fixtures/
│   ├── order.fixture.ts        <- factory buildOrder(overrides?)
│   ├── product.fixture.ts
│   └── ...
└── index.ts
```

Mock adapter implement contract yang sama persis dari `core`, return data statis dari
`fixtures/`. Package ini **tidak boleh** depend ke `@mixos-go/*-sdk` — kalau depend
ke situ, breaking change raw SDK bakal bikin test consumer app ikut merah, padahal tujuannya
justru supaya tidak ikut merah.

## 7. Naming convention

| Hal | Aturan | Contoh |
|---|---|---|
| Nama folder | `kebab-case` | `tts/`, `rate-limit.error.ts` |
| Nama file | `kebab-case` + suffix wajib (lihat tabel bawah) | `order.mapper.ts` |
| `interface` kontrak (punya method) | PascalCase, prefix `I` | `IOrderProvider` |
| `type`/`interface` data (noun, tanpa method) | PascalCase, tanpa prefix | `Order`, `OrderItem` |
| `class` | PascalCase | `PlatformAuthError` |
| `function`/`const` | camelCase | `mapShopeeOrder`, `createShopeeAdapter` |
| `enum`/union status | PascalCase untuk nama type, string literal lowercase-hyphen untuk value | `type OrderStatus = 'pending' \| 'ready-to-ship'` |
| Package npm | `@mixos-go/opensellpy-core`, `@mixos-go/opensellpy-adapter-<platform>` | — |

**Suffix file wajib** (biar 1 lihat nama file langsung tahu isinya, tanpa buka):

| Suffix | Isi | Boleh ada logic bisnis? |
|---|---|---|
| `.types.ts` | Type/interface data murni | Tidak |
| `.contract.ts` | Interface kontrak (method signature) | Tidak |
| `.provider.ts` | Implementasi kontrak, orchestration | Ya (orchestration saja) |
| `.mapper.ts` | Transformasi data raw ↔ domain | Ya (pure function saja) |
| `.error.ts` | Error class | Tidak |
| `.factory.ts` | Function pembuat instance/object kompleks | Ya |
| `.events.ts` | Event type/payload | Tidak |
| `.fixture.ts` | Data dummy untuk testing | Tidak |
| `.config.ts` | Config type + validasi | Sedikit (validasi saja) |

## 8. Aturan TypeScript (wajib, di-enforce oleh CI, bukan sekadar konvensi)

`tsconfig.base.json` di root, semua package `extends` dari sini:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "declaration": true,
    "composite": true,
    "skipLibCheck": true
  }
}
```

ESLint (`eslint.config.mjs`), rule yang wajib `error` (bukan `warn`):

- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-unsafe-assignment: error`
- `@typescript-eslint/no-unsafe-member-access: error`
- `@typescript-eslint/no-unsafe-call: error`
- `@typescript-eslint/explicit-function-return-type: error` (khusus di `core` dan
  `*.provider.ts`/`*.mapper.ts` — return type tidak boleh di-infer diam-diam)
- `@typescript-eslint/consistent-type-imports: error` (`import type { X }`, bukan `import { X }`)
- `no-restricted-imports`: dipakai untuk **enforce arah dependency** —
  - di `packages/core/**`: dilarang import apa pun dari `packages/adapters/**`,
    `packages/client/**`, atau raw SDK npm platform manapun.
  - di `packages/client/**`: dilarang import dari `packages/adapters/**`.
  - di `packages/adapters/<platform>/**`: dilarang import dari
    `packages/adapters/<platform-lain>/**`.
- `import/no-cycle: error` — tidak boleh ada circular import antar domain di dalam `core`
  maupun di dalam satu adapter.

`any` yang benar-benar tidak terhindarkan (misalnya raw response dari SDK platform yang tidak
punya tipe resmi) harus dibungkus `unknown` lalu divalidasi/di-narrow, bukan dibiarkan `any`
menyebar. Kalau perlu, definisikan ulang tipe raw response secara lokal di file mapper adapter
terkait (bukan pakai `any` dari SDK-nya).

## 9. Flow lengkap — dari request consumer sampai response

```
1. Consumer app manggil:
   client.platform('shopee').order.listOrders({ status: 'pending' })

2. OmnichannelClient.platform('shopee')
   -> ambil instance PlatformAdapter dari plugin-registry (sudah di-register saat init)

3. adapter.order.listOrders(params)  [order.provider.ts di adapter-shopee]
   -> order.params-mapper.ts: ubah params domain -> params raw Shopee
   -> panggil connector dari @mixos-go/shopee-sdk (raw SDK + OAuth/token sudah dihandle
      connector tersebut; adapter opensellpy tidak mengelola auth)
   -> kalau sukses: order.mapper.ts ubah raw response -> Order[] (domain type dari core)
   -> kalau gagal: shopee-error.mapper.ts ubah raw error -> PlatformError subclass dari core

4. Consumer app menerima PaginatedResult<Order> (tipe dari core, sama persis
   bentuknya walau platform beda) ATAU catch PlatformError (juga tipe dari core)
```

Untuk webhook, flow serupa tapi arahnya masuk:

```
1. Webhook raw payload masuk dari platform -> `adapter.webhook.verifySignature(req)`
   (kontrak `IWebhookHandler` dari core; HMAC hex per platform: Shopee url|body,
   TikTok app_key+body, Lazada body, Blibli MD5-based opsional)
2. `adapter.webhook.parse(req)` normalisasi raw payload -> `WebhookOrderEvent[]`
   (order.created / order.status_changed, dari core/webhook) di
   adapter-<X>/src/domains/order/order.webhook-mapper.ts
3. Aplikasi meng-ACK HTTP 2xx; idempotensi via `eventId`
   (dedup: tts_notification_id TTS, ordersn+status+update_time Shopee, dst.)
4. Consumer subscribe ke satu event handler yang sama, tidak peduli platform asal
```

Contoh payload per platform + skema verifikasi: `docs/webhook-payload-samples/`.

## 10. Checklist review — dependency direction (jalankan sebelum merge)

- [ ] `packages/core/package.json` → field `dependencies` kosong (boleh ada `devDependencies`).
- [ ] Tidak ada satu pun file di `packages/core/**` yang meng-import dari `packages/adapters/**`.
- [ ] Tidak ada satu pun file di `packages/adapters/<X>/**` yang meng-import dari
      `packages/adapters/<Y>/**` (X ≠ Y).
- [ ] `packages/client/package.json` → `dependencies` cuma `@mixos-go/opensellpy-core`.
- [ ] Tidak ada `any` baru yang lolos ESLint (`pnpm lint` harus 0 error).

## 11. OAuth/connector vs auth internal — di mana ia hidup

Dua hal yang **berbeda tanggung jawab**, walau datanya nanti tetap di **1 DB** yang sama:

1. **OAuth connector marketplace** (akses ke shop seller di Shopee/TTS/Lazada/Blibli):
   `connect URL` → `exchange code` → `access/refresh token` → `auto-refresh`. Inisiatifnya
   hidup di **repo SDK marketplace masing-masing** (`@mixos-go/shopee-sdk`, dst) memakai **satu
   contract/pattern seragam** yang disepakati (belum diimplement — masih design). opensellpy hanya
   mengkonsumsi connector itu; adapter opensellpy tidak mengelola OAuth (lihat §5).

2. **Auth internal platform opensellpy** (login user platform, RBAC/roles, SSO):
   ini milik **backend services opensellpy**, BUKAN bagian monorepo SDK ini. Ia beda sama sekali
   dari OAuth marketplace. Tidak ada modul auth internal di `packages/*`.

Arah `open item` untuk design berikutnya: contract pattern OAuth/connector yang seragam (dipakai
4 repo SDK) + skema DB yang menyatukan kredensial OAuth marketplace dan model user/RBAC internal
dalam satu database.

## 12. Notasi platform

- `PlatformKey = 'shopee' | 'tts' | 'lazada' | 'blibli'`
- `tts` = **TikTok Shop**, yang sudah melebur dengan Tokopedia (pasca-merger) dan memakai satu
  portal/API TikTok Shop (TTS). Tokopedia tidak dihitung entitas terpisah.
- Raw SDK package marketplace: `@mixos-go/shopee-sdk`, `@mixos-go/tiktok-shop-sdk`,
  `@mixos-go/lazada-sdk`, `@mixos-go/bli-bli-sdk` (nama package raw SDK **tidak** diubah ke `tts`).
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

## Dokumen

- `docs/ARCHITECTURE.md` — sumber kebenaran struktur & aturan
- `docs/ADDING_A_DOMAIN.md` — cara nambah domain universal
- `docs/ADDING_A_PLATFORM.md` — cara nambah platform adapter
- `docs/CAPABILITY_MATRIX.md` — matriks capability per platform
- `AGENTS.md` — panduan kerja agent
- `TODO.md` — fase & task terurut

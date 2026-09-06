# AGENTS.md

Panduan ini untuk **AI agent** (Claude Code, atau agent lain) yang mengerjakan repo ini. Baca
dulu `docs/ARCHITECTURE.md` sebelum mulai kerja — dokumen itu sumber kebenaran struktur & aturan
folder. File ini fokus ke *cara kerja* dan *checklist praktis*.

## 0. Sebelum mulai task apa pun

1. Baca `TODO.md`, cari task dengan status `[ ]` yang belum ada agent lain kerjakan (cek juga
   branch/PR yang lagi open supaya tidak dobel).
2. Baca `docs/ARCHITECTURE.md` bagian yang relevan dengan task (misal task di adapter Shopee →
   baca section 5).
3. Kalau task-nya "tambah domain baru" atau "tambah platform baru", baca
   `docs/ADDING_A_DOMAIN.md` / `docs/ADDING_A_PLATFORM.md` — ada langkah baku, jangan improvisasi
   struktur folder sendiri.
4. Scope satu task = satu PR = idealnya satu domain di satu package. Jangan gabung "tambah domain
   order di core" + "implement order di adapter-shopee" jadi satu PR kalau tidak diminta —
   pisahkan supaya gampang di-review dan gampang di-revert kalau ada yang salah.

## 1. Golden rules (tidak bisa dinego)

1. **`packages/core` tidak boleh import apa pun dari platform manapun.** Tidak raw SDK, tidak
   dari `packages/adapters/**`. Kalau task lo di `core` butuh tahu bentuk data Shopee, itu tanda
   task-nya salah tempat — harusnya dikerjakan di adapter.
2. **Satu adapter tidak boleh import dari adapter lain.** `adapter-lazada` tidak boleh tahu
   apa-apa soal `adapter-shopee`.
3. **Tidak ada `any`.** Kalau raw response dari SDK platform tidak ada tipenya, define ulang tipe
   lokal (interface) di file mapper terkait berdasarkan actual response, bungkus jadi `unknown`
   dulu kalau perlu, baru narrow. Jangan `as any`, jangan `: any` di parameter.
4. **Domain baru masuk `extra/` dulu, bukan langsung ke `core`.** Kalau baru dipakai 1 platform,
   dia belum "domain universal". Naik ke `core` cuma kalau sudah kepakai ≥2 platform dengan
   semantik yang sama. Jangan ambil keputusan ini sendiri kalau ragu — tulis di PR description
   dan tandai untuk didiskusikan, jangan langsung taruh di `core`.
5. **Jangan ubah file domain/platform lain untuk keperluan task di domain/platform yang sedang
   dikerjakan.** Kalau merasa terpaksa harus ubah, berhenti — itu sinyal desainnya salah, laporkan
   di PR description, jangan dipaksakan.
6. **Setiap file punya satu tanggung jawab sesuai suffix-nya** (lihat tabel suffix di
   `docs/ARCHITECTURE.md` §7). Jangan taruh mapping logic di `*.provider.ts`, jangan taruh
   orchestration/network call di `*.mapper.ts`.
7. **`raw` field wajib diisi** di setiap domain type yang datang dari mapper — jangan dihapus demi
   "kebersihan", ini jalan darurat kalau ada kebutuhan data yang belum dinormalisasi.
8. **Error harus di-normalize sebelum keluar dari adapter.** Tidak boleh ada raw error dari SDK
   platform (misal `ShopeeApiError`) yang bocor ke consumer — selalu ditangkap dan di-mapping ke
   subclass `PlatformError` dari `core`, dengan `cause` diisi error aslinya.

## 2. Cara nambah domain baru ke `core` (ringkas — detail di `docs/ADDING_A_DOMAIN.md`)

```
1. Buat folder packages/core/src/domains/<nama-domain>/
2. Buat <nama-domain>.types.ts   -> data types (noun, tanpa method)
3. Buat <nama-domain>.contract.ts -> interface I<NamaDomain>Provider (method saja)
4. Buat index.ts                 -> re-export dari 2 file di atas
5. Tambahkan '<nama-domain>' ke union type DomainKey di core/src/platform/domain-key.ts
6. Update docs/CAPABILITY_MATRIX.md
7. TIDAK perlu ubah adapter manapun di step ini — adapter implement belakangan, terpisah task
```

## 3. Cara nambah domain khusus platform (`extra/`)

```
1. Buat folder packages/adapters/<platform>/src/extra/<nama-domain>/
2. Definisikan interface kontraknya LOKAL di situ (bukan di core), prefix I<Platform><Nama>Provider
   contoh: IShopeeLiveProvider
3. Implement provider + mapper seperti domain biasa
4. Export lewat field `extra` di PlatformAdapter, BUKAN lewat field domain utama
5. Jangan tambahkan ke DomainKey union di core — DomainKey hanya untuk domain universal
```

## 4. Cara nambah platform adapter baru

```
1. Buat packages/adapters/<platform-baru>/ dengan struktur sama persis seperti packages/adapters/shopee/
   (lihat docs/ARCHITECTURE.md §5)
2. package.json: dependencies ke raw sdk platform tsb (`@mixos-go/<platform>-sdk`), peerDependencies
   ke @mixos-go/opensellpy-core. OAuth/connector lifecycle (connect/exchange/refresh token) TIDAK dibuat di
   sini — itu hidup di repo SDK marketplace via contract/pattern seragam. Adapter cukup konsumsi
   connector tsb lalu map hasilnya ke kontrak domain `core`.
3. Implement domain SATU PER SATU, urutan prioritas: order -> product -> category -> inventory
   -> logistics -> (baru domain lain sesuai kebutuhan)
4. Isi capabilities.ts HANYA dengan DomainKey yang benar-benar sudah diimplement dan ditest.
   Jangan masukin domain yang providernya masih throw 'not implemented'.
5. Tambah mock adapter yang sepadan di packages/testing/src/mock-adapters/
6. Update docs/CAPABILITY_MATRIX.md
```

## 5. Definition of done — checklist wajib sebelum PR dianggap selesai

- [ ] `pnpm typecheck` lulus di package yang disentuh (dan package lain yang depend ke situ).
- [ ] `pnpm lint` lulus 0 error — termasuk rule `no-restricted-imports` (arah dependency) dan
      `no-explicit-any`.
- [ ] Tidak ada file di luar scope task yang berubah tanpa alasan jelas di PR description.
- [ ] Kalau nambah/ubah provider: ada unit test dengan mock raw response (bukan hit API asli).
- [ ] Kalau nambah/ubah mapper: ada unit test untuk kasus data lengkap DAN data
      kosong/null/partial (mapper tidak boleh crash kalau field opsional platform kosong).
- [ ] Kalau nambah domain/platform baru: `docs/CAPABILITY_MATRIX.md` sudah diupdate.
- [ ] `raw` field ada di setiap object domain type yang dihasilkan mapper.
- [ ] Error dari raw SDK sudah di-mapping ke `PlatformError` subclass, tidak bocor mentah.
- [ ] Commit message dan PR title menyebutkan package yang disentuh, contoh:
      `feat(adapter-shopee): implement order domain`.

## 6. Command penting

```bash
pnpm install                        # install semua workspace
pnpm --filter @mixos-go/opensellpy-core build
pnpm --filter @mixos-go/opensellpy-adapter-shopee test
pnpm typecheck                      # semua package
pnpm lint                           # semua package
pnpm changeset                      # wajib sebelum PR yang mengubah public API package apa pun
```

## 7. Kalau ragu

Jangan menebak lalu jalan terus. Kalau ada keputusan desain yang tidak jelas jawabannya di
`docs/ARCHITECTURE.md` (misal: "domain ini harusnya universal atau extra?", "field ini masuk
`Order` atau `OrderItem`?") — tulis pertanyaannya secara eksplisit di PR description bagian
paling atas, kasih 2 opsi yang dipertimbangkan beserta trade-off singkatnya, dan tandai PR sebagai
draft. Jangan ambil keputusan struktural sepihak yang mempengaruhi domain/adapter lain.
# ADDING_A_PLATFORM

Panduan untuk menambah **platform adapter baru** ke `packages/adapters/<platform-baru>/`.

Struktur tiap adapter mengikuti **pola sama persis** `packages/adapters/shopee/` (lihat
`docs/ARCHITECTURE.md` §5) supaya antar-platform konsisten dan mudah direview.

Baca dulu `docs/ARCHITECTURE.md` §5 dan `docs/ADDING_A_DOMAIN.md` sebelum mulai.

---

## Langkah

```
1. Buat packages/adapters/<platform-baru>/ dengan struktur sama persis seperti packages/adapters/shopee/
2. package.json:
   - dependencies: raw sdk platform tsb (@mixos-go/<platform>-sdk)
   - peerDependencies: @mixos-go/opensellpy-core
   - TIDAK boleh depend ke adapter platform lain, TIDAK boleh depend ke client
3. Implement domain SATU PER SATU, urutan prioritas:
   order -> product -> category -> inventory -> logistics -> (domain lain sesuai kebutuhan)
4. Isi capabilities.ts HANYA dengan DomainKey yang benar-benar sudah diimplement dan ditest.
   Jangan masukin domain yang providernya masih throw 'not implemented'.
5. Tambah mock adapter yg sepadan di packages/testing/src/mock-adapters/
6. Update docs/CAPABILITY_MATRIX.md
```

## Urutan domain prioritas

Alasan order dulu: kontrak `Order` jadi acuan pola untuk provider/mapper/params-mapper/status-map
di semua domain. Begitu `order` di satu adapter selesai, platform lain bisa mulai paralel
(adapter tts/lazada/blibli tidak perlu nunggu seluruh shopee selesai — cukup pola order-nya).

## OAuth/connector

**JANGAN** implement OAuth/connector (connect URL, exchange code, access/refresh token) di adapter
opensellpy. Itu hidup di repo SDK marketplace (`@mixos-go/*-sdk`) via contract/pattern seragam
yang disepakati. Adapter cukup:
- instantiate/konfigurasi connector dari raw SDK tsb (di `client/<platform>.factory.ts`), lalu
- map hasilnya ke kontrak domain `core`.

Kalau platform punya endpoint yang belum didukung connector SDK-nya → laporkan, jangan
dipaksa implement OAuth di sisi opensellpy.

## Definition of done

- [ ] Struktur adapter identik pola shopee.
- [ ] `pnpm typecheck` lulus di package baru + yang depend ke situ.
- [ ] `pnpm lint` 0 error.
- [ ] `capabilities.ts` hanya berisi domain yang selesai & ditest.
- [ ] Ada mock adapter di `packages/testing`.
- [ ] `docs/CAPABILITY_MATRIX.md` diupdate.
- [ ] Commit message & PR title menyebut package (mis. `feat(adapter-tts): implement order domain`).

# ADDING_A_DOMAIN

Panduan langkah demi langkah untuk menambah **domain universal** ke `packages/core`, atau
**domain khusus platform** ke `packages/adapters/<platform>/src/extra/`.

Baca dulu `docs/ARCHITECTURE.md` §3 sebelum mulai.

---

## 1. Domain universal (masuk `core`)

Syarat: domain punya **semantik yang sama lintas ≥2 platform**. Kalau baru dipakai 1 platform,
belum termasuk universal → pakai jalur §2 (extra).

```
1. Buat folder packages/core/src/domains/<nama-domain>/
2. Buat <nama-domain>.types.ts      -> data types (noun, tanpa method)
3. Buat <nama-domain>.contract.ts   -> interface I<NamaDomain>Provider (method saja)
4. Buat index.ts                    -> re-export dari 2 file di atas, TIDAK ADA LOGIC
5. Tambahkan '<nama-domain>' ke union type DomainKey di core/src/platform/domain-key.ts
6. Update docs/CAPABILITY_MATRIX.md
7. TIDAK perlu ubah adapter manapun di step ini — adapter implement belakangan, task terpisah
```

Aturan:
- `*.types.ts` hanya berisi `interface`/`type` data (noun). Tidak ada interface berisi method.
- `*.contract.ts` hanya method (verb), prefix wajib `I` (mis. `IOrderProvider`).
- Tidak ada implementasi logic apa pun di `core`.
- Kalau data type butuh tipe dari domain lain → pindah dulu ke `core/src/shared/`, jangan
  import antar-domain langsung (kecuali lewat `shared/`).
- Naming & suffix ikut `docs/ARCHITECTURE.md` §7.

## 2. Domain khusus platform (masuk `extra/`)

Untuk domain yang TIDAK punya padanan lintas platform (mis. live streaming, ads, coins).

```
1. Buat folder packages/adapters/<platform>/src/extra/<nama-domain>/
2. Definisikan interface kontraknya LOKAL di situ (bukan di core), prefix I<Platform><Nama>Provider
   contoh: IShopeeLiveProvider, ITtsAffiliateProvider
3. Implement provider + mapper seperti domain biasa (lihat ARCHITECTURE §5)
4. Export lewat field `extra` di PlatformAdapter, BUKAN lewat field domain utama
5. Jangan tambahkan ke DomainKey union di core — DomainKey hanya untuk domain universal
```

Catatan "naik kelas": kalau ternyata platform lain juga butuh domain yang sama, domain itu
dipindah ke `core` (bukan didiamkan dobel di `extra/` masing-masing adapter). Ini keputusan
struktural → tandai di PR description & diskusikan, jangan ambil sendiri.

## Definition of done

- [ ] `pnpm typecheck` lulus di package yang disentuh.
- [ ] `pnpm lint` 0 error (termasuk arah dependency & no-explicit-any).
- [ ] `raw` field ada di setiap object domain type hasil mapper (kalau ada mapper).
- [ ] Error dari raw SDK sudah di-mapping ke `PlatformError` subclass (kalau ada).
- [ ] `docs/CAPABILITY_MATRIX.md` diupdate sesuai arah (universal → core / platform → extra).

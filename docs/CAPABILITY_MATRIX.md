# CAPABILITY_MATRIX

Matriks kemampuan (capability) per platform adapter. Kolom = 4 platform, baris = domain.

- `✅` didukung (terimplement & ditest di adapter tsb)
- `❌` tidak didukung / tidak tersedia di API platform tsb
- `⬜` belum diimplement (masih TODO)

> Sinkronkan selalu dengan `capabilities.ts` tiap adapter. Kalau beda, `capabilities.ts` di
> tiap adapter adalah sumber kebenaran runtime; matriks ini untuk pandangan manusia.

Platform key: `shopee` | `tts` (TikTok Shop, pasca-merger Tokopedia) | `lazada` | `blibli`

## Domains universal (`core`)

| Domain | shopee | tts | lazada | blibli |
|---|---|---|---|---|
| order | ✅ | ⬜ | ⬜ | ⬜ |
| product | ✅ | ⬜ | ⬜ | ⬜ |
| category | ✅ | ⬜ | ⬜ | ⬜ |
| inventory | ✅ | ⬜ | ⬜ | ⬜ |
| logistics | ✅ | ⬜ | ⬜ | ⬜ |

## Catatan

- Domain yang tidak tersedia di API platform tertentu (mis. sudah dipastikan blibli tidak punya)
  tandai `❌`, jangan dipaksa implement.
- Domain spesifik platform (extra/) dicatat di bawah masing-masing adapter, bukan di matriks ini.
- shopee ✅ = provider + mapper + params-mapper + status-map terimplement; unit test mapper.
  Batasan yang dicatat: (1) ListProducts default hanya barang aktif (`NORMAL`); (2) item ber-model
  direpresentasikan satu variant harga dasar; (3) pagination order berbasis cursor sehingga
  `page > 1` belum bisa lanjut (kontrak core pakai page/limit); (4) `listWarehouses` mengembalikan
  lokasi tunggal `DEFAULT` karena Shopee tak punya endpoint daftar gudang global;
  (5) `cancelShipment` tidak didukung API Shopee (ValidationError).

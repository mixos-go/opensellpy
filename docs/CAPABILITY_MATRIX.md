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
| order | ✅ | ✅ | ✅ | ⬜ |
| product | ✅ | ✅ | ✅ | ⬜ |
| category | ✅ | ✅ | ✅ | ⬜ |
| inventory | ✅ | ✅ | ✅ | ⬜ |
| logistics | ✅ | ✅ | ✅ | ⬜ |

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
- tts ✅ = provider + mapper + params-mapper + status-map terimplement; unit test mapper.
  Batasan yang dicatat: (1) pagination TTS pakai `page_token` (cursor) sehingga `page > 1` belum
  bisa lanjut; (2) ListProducts melakukan detail per produk (search response hanya id) sehingga
  lebih lambat di catalog besar; (3) pembatalan order & `cancelShipment` tidak didukung via API
  TTS (ValidationError — batalkan via Seller Center); (4) `updateOrderStatus` hanya transisi
  `shipped` (create package); (5) `getStock` berbasis SKU terdaftar; `warehouseId` diabaikan pada
  `updateStock` (stok TTS SKU-level); (6) tracking tersedia utk paket yang dibuat via
  `createShipment` (id paket di-memori di adapter).
- lazada ✅ = provider + mapper + params-mapper + status-map terimplement; unit test mapper.
  Batasan yang dicatat: (1) tidak ada endpoint `activate` produk → `updateProduct({status:'active'})`
  = ValidationError (re-aktifkan via Seller Center); (2) `listProducts` melakukan detail per id
  (`getProductItem`) karena response `getProducts` hanya item_id → N+1; (3) `getTracking` adalah
  snapshot dari `order/items/get` (tidak ada riwayat event lintas carrier) dan hanya utk paket yang
  dibuat via `createShipment` (map id ke order di-memori); (4) `cancelShipment` & pembatalan order
  tidak didukung API → ValidationError; (5) `listWarehouses` mengembalikan lokasi tunggal `DEFAULT`
  (Lazada tak punya endpoint daftar gudang global); (6) `createProduct/createShipment` selalu
  quantity/stock = 0 — segera lanjut dengan `updateStock`.

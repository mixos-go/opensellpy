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
| order | ✅ | ✅ | ✅ | ✅ |
| product | ✅ | ✅ | ✅ | ✅ |
| category | ✅ | ✅ | ✅ | ✅ |
| inventory | ✅ | ✅ | ✅ | ✅ |
| logistics | ✅ | ✅ | ✅ | ✅ |

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
- blibli ✅ = provider + mapper + params-mapper + status-map terimplement; unit test mapper + client
  wrapper (`callRaw`/`assertOk` envelope). SDK `@mixos-go/bli-bli-sdk` diakses via `client.request`
  dengan spec custom (method generated SDK punya path/body yang rusak: path literal contoh,
  `body: []`, typo `/filter**`). Batasan yang dicatat: (1) Blibli **tanpa OAuth** — auth = Basic
  (clientKey:clientSecret) + header `Api-Seller-Key`; `redirectUri` tidak terpakai;
  (2) satu Order domain = satu order-item Blibli (`itemId`), bukan order kart lengkap (`id` order —
  dicatat sebagai `platformOrderId`); (3) `updateOrderStatus` hanya `shipped` (= pack+fulfill,
  dengan fallback Create Package V1 dari Combine Shipping API), pembatalan order tidak didukung;
  (4) product domain memakai product **L3/sellerSku** dengan SATU variant sintetis (harga
  `price.normal.min`) karena Blibli tidak punya variant listing di list/detail;
  (5) `updateProduct` mendukung name/description + archive/unarchive; ganti kategori & kelola
  gambar = ValidationError (kategori via Seller Center, gambar per-blibliSku via Add Image V1);
  (6) stok Blibli per-variant/blibliSku (L4): `getStock` = agregat `counter.stock` (Product List V3),
  `updateStock` memerlukan blibliSku — di-resolve otomatis dari Product Variant Pickup Point List V1
  saat input berupa sellerSku (gagal → ValidationError);
  (7) `createProduct` = Create Product V3 (queue async, 202) — payload berisi product `name`,
  `categoryCode`, `productItems[{sellerSku, price, stock:0}]`; butuh isian brand/dimensi/logistic di
  Seller Center utk lolos approval; (8) warehouse = pickup point Blibli (Pickup Point List V2);
  (9) `getTracking` membaca Order List V2 (filter `packageId`) + Order Detail V2
  (`shipment.statuses`), `cancelShipment` tidak didukung API → ValidationError;
  (10) `draft` tidak punya filter/nilai state → `toBlibliProductStateFilter('draft') = undefined`.

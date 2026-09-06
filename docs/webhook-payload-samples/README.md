# Webhook Payload Samples

Contoh payload webhook / push order untuk ke-4 platform adapter, hasil riset dari
dokumentasi resmi (lihat `_meta` di tiap file). Dipakai sebagai acuan unit test
`order.webhook-mapper.ts` tiap adapter dan dokumen acuan implementasi konsumen.

| File | Platform | Event | Envelope |
|---|---|---|---|
| `shopee-order-status-change.json` | Shopee | Order Status Update (push code 3) | `{code, timestamp, shop_id, data{ordersn, status, update_time, ...}}` |
| `tiktok-shop-order-status-change.json` | TikTok Shop | Order status change (`type: 1`) | `{type, tts_notification_id, shop_id, timestamp, data{order_id, order_status, ...}}` |
| `lazada-order-status-change.json` | Lazada | Push order (LPM, `message_type: 0`) | `{seller_id, message_type, data{...}, timestamp, site}` |
| `blibli-order-delivered.json` | Blibli | `delivered_order` (event body flat) | flat order-item object |

## Ringkasan verifikasi & respond

| Platform | Signature header | Algoritma | ACK | Dedup key |
|---|---|---|---|---|
| Shopee | `Authorization` | `HMAC-SHA256(partner_key, url + "|" + rawBody)` hex | HTTP 2xx body kosong, < 3s | `ordersn` + `status` + `update_time` |
| TikTok Shop | `Authorization` | `HMAC-SHA256(app_secret, app_key + rawBody)` hex | HTTP 200 body kosong, < 3s | `tts_notification_id` |
| Lazada | `Authorization` | `HMAC-SHA256(app_secret, rawBody)` hex | HTTP 200 secepatnya | `trade_order_line_id` + `status_update_time` |
| Blibli | `signature` (opsional) | `HMAC-SHA256(key, method\\n md5hex(body) \\n content-type \\n date \\n callbackUrl)` hex | HTTP 200 | `orderItemId` + `orderStatus` + `timestamp` |

Catatan penting:

- **RAW body untuk signature**: semua platform meng-hash *string body mentah persis
  seperti datang* — jangan `JSON.stringify(JSON.parse(body))` sebelum verifikasi.
- **Shopee** butuh **URL callback penuh** untuk membangun base string; berikan
  `url` pada `WebhookRequest`.
- **Blibli** signature bersifat opsional dan nilai `date` yang dipakai platform
  (diformat dari `requestTime`, `WIB`) sulit direkonstruksi persis — test verifikasi
  Blibli memakai nilai date/requestTime kendali penuh.
- `returned_order` Blibli punya struktur berbeda (RMA: `returnId`, `rmaNumber`,
  `returnStatusCode`, ...) dan belum di-normalisasi di Fase 9 (diluar order status).
- Lazada `message_type` selain 0 (reverse order / return) dilewatkan mapper Fase 9.
- Tourist: urutan status webhook TTS memakai `CANCEL` (bukan `CANCELLED`) dan Blibli
  `CX/RT/VB/FR` tidak muncul di dokumentasi webhook (hanya via Order API) — mapper
  tetap membaca `orderStatus` dgn vocab Order API.
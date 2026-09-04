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
| order | ⬜ | ⬜ | ⬜ | ⬜ |
| product | ⬜ | ⬜ | ⬜ | ⬜ |
| category | ⬜ | ⬜ | ⬜ | ⬜ |
| inventory | ⬜ | ⬜ | ⬜ | ⬜ |
| logistics | ⬜ | ⬜ | ⬜ | ⬜ |

## Catatan

- Domain yang tidak tersedia di API platform tertentu (mis. sudah dipastikan blibli tidak punya)
  tandai `❌`, jangan dipaksa implement.
- Domain spesifik platform (extra/) dicatat di bawah masing-masing adapter, bukan di matriks ini.

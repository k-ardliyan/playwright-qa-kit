# Alpha Limitations — v0.1.0-alpha.1

Daftar keterbatasan **jujur** untuk rilis alpha. Framework ini **bukan production** dan **bukan General Availability (GA)**.

Workshop dan panduan QA:

- [WORKSHOP.md](WORKSHOP.md)
- [Go/No-Go](WORKSHOP.md#go-no-go)
- [GUIDE.md](GUIDE.md)
- [README.md](README.md) — indeks dokumen

---

## Status rilis

| Label          | Arti                                                             |
| -------------- | ---------------------------------------------------------------- |
| **Alpha**      | Uji coba internal dengan facilitator; fitur dan UX masih berubah |
| **Bukan GA**   | Belum untuk fork production tanpa maintainer dedicated           |
| **Bukan beta** | Belum diuji cohort luas tanpa hand-holding penuh                 |

---

## Yang alpha **janjikan**

- Tulis requirement markdown + validasi format
- Pipeline AI **Plan → Generate → Execute** ke `src/tests/` (dengan facilitator)
- Run tes lokal + laporan dashboard
- Path B: jalankan adapter ERPKU (smoke/regression) + jelajah spec referensi di `example/erpku/tests/`

---

## Yang alpha **tidak** janjikan

### Workshop Path B

- **Generate AI ke `example/erpku/tests/`** — folder adapter adalah spec referensi manual; Generator hanya menulis ke `src/tests/`
- Path B sebagai pengganti latihan pipeline penuh — gunakan Path A untuk exercise requirement → spec

### Production & operasi

- Fork production tanpa risiko — gunakan [FORK-ONBOARDING.md](FORK-ONBOARDING.md) hanya setelah beta
- CI E2E otomatis untuk semua fork (butuh GitHub Secrets + setup IT)
- Zero-touch onboarding tanpa facilitator

### Pipeline AI / Healer

- **Self-healing end-to-end** — Healer didukung tapi **best-effort**; facilitator mungkin perlu perbaiki manual
- Heal otomatis untuk semua jenis kegagalan (selector, auth, env, app bug)
- Pipeline AI tanpa restart MCP setelah ubah env

### MCP & validasi (open architecture items)

| Gap                                                         | Dampak alpha                                            | Workaround                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Bulk validate/list hanya scan `src/tests/` (#17)            | Bulk validate tanpa `filePath` bisa lewat adapter specs | Validasi per-file (`validate_generated_tests` + path); facilitator review |
| `health_check` tidak probe `AUTH_*` / adapter overlay (#18) | Auth error muncul saat run, bukan pre-flight            | Jalankan smoke ERPKU sebelum workshop Path B                              |
| `setup-check` vs `health-check` belum unified (#22)         | `pretest` lebih dangkal dari MCP pre-flight             | Pakai `npm run health:check` sebelum sesi                                 |

### Environment & MCP

- Setiap ubah `environments/local.env` → **restart MCP servers**
- `PLAYWRIGHT_CONFIG` harus selaras antara `playwright-test` dan `playwright-qa` (setelah Rollout Bundle #16/#19 — masih butuh restart)
- Path B butuh `AUTH_*` manual di `local.env`

### Dokumentasi marketing vs alpha

README menyebut "Self-Healing" — pada alpha ini **aspirational**. Perbaikan otomatis bergantung pada kualitas Healer, jumlah failure, dan facilitator.

---

## Known technical debt (post-alpha backlog)

- #17 — Bulk scan Reference Adapter root (Generator tetap output `src/tests/` only)
- #18 — health_check adapter env + AUTH probe
- #21 — Unified env validation interface
- #22 — Consolidated preflight module
- CI artifact paths untuk mixed core + adapter runs (#29/#30)

---

## Kapan naik ke beta?

Minimal:

1. Satu workshop alpha selesai + feedback diproses
2. Tag `v0.2.0-beta.1` dengan top issues teratas diperbaiki
3. Dry-run cohort kedua dengan facilitator **ringan** (bukan step-by-step tiap menit)

---

## Laporkan issue alpha

Sampaikan ke facilitator dengan:

- Path A atau B
- Langkah yang gagal
- Output `npm run health:check`
- Screenshot MCP panel (jika relevan)

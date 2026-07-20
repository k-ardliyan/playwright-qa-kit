# Playwright QA Kit — Cheat Sheet

> Print halaman ini (A4 portrait) dan tempel di meja Anda.

---

## Setup Pertama Kali

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
cp environments/local.env.example environments/local.env   # isi BASE_URL + kredensial
npm run setup:check && npm run health:check
```

---

## Daily Flow

```bash
# 1. Tulis requirement
cp requirements/_TEMPLATE.md requirements/fitur-saya.md

# 2. Validasi + dapat prompt agent
npm run qa:run -- requirements/fitur-saya.md

# 3. Buka report
start reports/custom-dashboard.html    # Windows
open reports/custom-dashboard.html     # Mac
```

---

## Command Paling Sering

| Command                             | Kapan                                            |
| ----------------------------------- | ------------------------------------------------ |
| `npm run qa:run -- X`               | Happy path 1-command (validate + prompt + smoke) |
| `npm run validate:requirement -- X` | Cek requirement saja                             |
| `npm run manual:check`              | List semua skenario `(@manual)`                  |
| `npm test`                          | Jalankan semua test                              |
| `npm run test:smoke`                | Cuma smoke test                                  |
| `npm run health:check`              | Cek MCP + env                                    |

---

## Tipe Skenario

| Tag                     | Artinya                                   |
| ----------------------- | ----------------------------------------- |
| `(@success)`            | Happy path — alur normal                  |
| `(@failure)`            | Negative path — validasi, input salah     |
| `(@access-restriction)` | Role tidak berhak, akses ditolak          |
| `(@manual)`             | Tidak bisa diotomasi (CAPTCHA, OTP, dsb.) |

---

## Kalau Gagal — Cek Ini Dulu

| Gejala                       | Pertama Cek                                |
| ---------------------------- | ------------------------------------------ |
| `health_check` fail          | `npm run mcp:build` lalu restart IDE       |
| `validate_requirement` error | Baca hint di output → perbaiki → coba lagi |
| Test gagal semua satu role   | Cek `.auth/<role>.json` ada atau belum     |
| Auth file missing            | `npx playwright test auth.setup.ts`        |
| Exit `2` (escalate)          | Hubungi Framework Maintainer               |

---

## Keputusan Setelah Report

| Kondisi                    | Keputusan                             |
| -------------------------- | ------------------------------------- |
| Semua pass                 | ✅ APPROVE — archive sebagai baseline |
| Failure: app salah         | 🐛 FILE BUG — buat defect ticket      |
| Failure: requirement kabur | 📝 REVISE REQUIREMENT                 |
| Failure: test/AI salah     | 🔧 FIX TEST/GENERATOR                 |
| Failure: auth/env/data     | 🔧 FIX ENVIRONMENT                    |
| Tidak bisa diselesaikan    | 🚫 MARK BLOCKED                       |

---

## Referensi Cepat

| Dokumen                  | Link                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| Panduan lengkap          | [docs/GUIDE.md](GUIDE.md)                                         |
| Template requirement     | [requirements/_TEMPLATE.md](../requirements/_TEMPLATE.md)         |
| Contoh requirement baik  | [requirements/_GOOD_EXAMPLE.md](../requirements/_GOOD_EXAMPLE.md) |
| Panduan `@manual`        | [docs/MANUAL-SCENARIOS.md](MANUAL-SCENARIOS.md)                   |
| Keputusan QA post-report | [docs/QA-DECISION-MODEL.md](QA-DECISION-MODEL.md)                 |
| Auth per role            | [docs/AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md)     |
| Exit codes               | [docs/EXIT-CODES.md](EXIT-CODES.md)                               |

---

> **Tips:** Mulai dari `requirements/example-login-extension.md`. Copy → rename → modifikasi → validate → pipeline.

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
# PATH A — langsung pipeline (default, untuk QA pemula)
cp requirements/_TEMPLATE.md requirements/fitur-saya.md
npm run qa:run -- requirements/fitur-saya.md
start reports/custom-dashboard.html   # Windows
open  reports/custom-dashboard.html   # Mac

# PATH B — dengan POM (untuk fitur reusable atau role-aware)
# 1. Snapshot halaman (sekali, di-cache)
# snapshot_page (playwright-qa) — url, featureName, pageName
# 2. Generate scaffold
# generate_page_object (playwright-qa) — featureName, pageName
# 3. Edit src/pages/<Class>.ts + register di src/fixtures/project.fixture.ts
# 4. Lanjut pipeline normal
npm run qa:run -- requirements/fitur-saya.md
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

## POM Workflow (Path B — opsional)

```
# 1. Snapshot halaman → catalog tersimpan permanen
snapshot_page (playwright-qa) — url, featureName, pageName

# 2. Generate scaffold dari catalog
generate_page_object (playwright-qa) — featureName, pageName
→ src/pages/<ClassName>.ts (skip jika sudah ada)

# 3. Edit scaffold + register di src/fixtures/project.fixture.ts

# 4. Pipeline berjalan normal — Generator auto-import POM
```

> Path A (tanpa POM): langsung pipeline, Generator pakai inline locators — cukup untuk QA pemula.

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

| Dokumen                 | Link                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| Panduan lengkap         | [docs/GUIDE.md](GUIDE.md)                                         |
| Template requirement    | [requirements/_TEMPLATE.md](../requirements/_TEMPLATE.md)         |
| Contoh requirement baik | [requirements/_GOOD_EXAMPLE.md](../requirements/_GOOD_EXAMPLE.md) |
| Panduan `@manual`       | [docs/MANUAL-SCENARIOS.md](MANUAL-SCENARIOS.md)                   |
| Auth per role           | [docs/AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md)     |

---

> **Tips:** Mulai dari `requirements/example-login-extension.md`. Copy → rename → modifikasi → validate → pipeline.

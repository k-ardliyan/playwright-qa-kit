# 🚀 Playwright QA Kit — Cheat Sheet untuk Pemula

> Print halaman ini (A4 portrait) dan tempel di meja Anda.

---

## Setup Pertama Kali (5 menit)

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
cp environments/local.env.example environments/local.env   # edit BASE_URL + kredensial
npm run setup:check && npm run health:check
```

---

## Daily Flow (3 langkah)

```bash
# 1. Tulis requirement
cp requirements/_TEMPLATE.md requirements/fitur-saya.md

# 2. Validate + dapat prompt agent (1 command!)
npm run qa:run -- requirements/fitur-saya.md

# 3. Buka report
start reports/custom-dashboard.html    # Windows
open reports/custom-dashboard.html     # Mac
```

---

## Command Paling Sering

| Command                             | Kapan                                                |
| ----------------------------------- | ---------------------------------------------------- |
| `npm run qa:run -- X`               | **Happy path 1-command** (validate + prompt + smoke) |
| `npm run validate:requirement -- X` | Cek requirement saja                                 |
| `npm run manual:check`              | List semua skenario `(@manual)`                      |
| `npm test`                          | Jalankan semua test                                  |
| `npm run test:smoke`                | Cuma smoke test                                      |
| `npm run health:check`              | Cek MCP + env                                        |

---

## Visual Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ TULIS        │    │ VALIDASI     │    │ PROMPT AGENT │
│ requirement  │───>│ requirement  │───>│ (paste IDE)  │
│ (.md)        │    │ (CLI)        │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                ┌──────────────▼───────┐
                                │ REVIEW REPORT        │
                                │ reports/dashboard.html│
                                └───────────────────────┘
```

---

## Kalau Gagal — Cek Ini Dulu

| Gejala                       | Pertama Cek                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `health_check` fail          | `npm run mcp:build` lalu restart IDE                                            |
| `validate_requirement` error | Lihat [GUIDE.md#troubleshooting](GUIDE.md#troubleshooting-validate-requirement) |
| Test fail semua              | Lihat [GUIDE.md#troubleshooting](GUIDE.md#troubleshooting-health-check)         |
| Bingung harus apa            | Baca [GUIDE.md](GUIDE.md) dari atas                                             |
| Exit code aneh               | [docs/EXIT-CODES.md](EXIT-CODES.md)                                             |

---

## Eskalasi

Hubungi **Framework Maintainer** kalau:

- `npm run setup:check` gagal setelah ikuti panduan
- `validate_requirement` error di file yang sudah ikuti template
- Tool MCP return error yang gak ada di troubleshooting

**Bukan bug framework:** selector aplikasi salah, POM belum ada, bug di app yang diuji.

---

## Link Cepat

| Untuk                       | Buka                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| 📖 Panduan lengkap          | [docs/GUIDE.md](GUIDE.md)                                         |
| 📝 Template requirement     | [requirements/_TEMPLATE.md](../requirements/_TEMPLATE.md)         |
| ✅ Contoh requirement baik  | [requirements/_GOOD_EXAMPLE.md](../requirements/_GOOD_EXAMPLE.md) |
| ❌ Contoh requirement buruk | [requirements/_BAD_EXAMPLE.md](../requirements/_BAD_EXAMPLE.md)   |
| 📋 Panduan `@manual`        | [docs/MANUAL-SCENARIOS.md](MANUAL-SCENARIOS.md)                   |
| 🚦 Exit codes               | [docs/EXIT-CODES.md](EXIT-CODES.md)                               |
| 🏠 README utama             | [README.md](../README.md)                                         |

---

> **Tips terakhir:** Mulai dari requirement yang ada di `requirements/example-login-extension.md`.
> Copy → rename → modifikasi → validate. Kalau sudah lulus validate, prompt agent dan lihat report.

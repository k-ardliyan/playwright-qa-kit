# Panduan QA — Bekerja di Laptop Lokal

Dokumen ini panduan utama tim QA. Untuk kontrak tool MCP, lihat [CUSTOM-MCP.md](../CUSTOM-MCP.md). Untuk diagram pipeline, lihat [README.md](../README.md).

## Mulai di Sini

| Langkah                       | Dokumen                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Tulis requirement             | [`requirements/_TEMPLATE.md`](../requirements/_TEMPLATE.md) + [writing-requirements.md](writing-requirements.md) |
| Rapikan dengan ChatGPT/Gemini | [prompt-external-ai.md](prompt-external-ai.md)                                                                   |
| Jalankan pipeline di Cursor   | [prompt-cursor-agent.md](prompt-cursor-agent.md)                                                                 |
| Contoh valid                  | [`requirements/example-login-extension.md`](../requirements/example-login-extension.md)                          |

---

## Setup Lokal (Sekali per Mesin)

### 1. Prasyarat

- Node.js **>= 20**
- Git
- Cursor atau VS Code dengan MCP aktif

### 2. Instalasi

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
```

### 3. Environment

```bash
# Salin template environment
copy environments\local.env.example environments\local.env   # Windows
# cp environments/local.env.example environments/local.env     # Mac/Linux
```

Isi `BASE_URL`, kredensial tes di `environments/local.env`. **Jangan commit** file `.env` berisi password.

### 4. Verifikasi setup

```bash
npm run setup:check
```

Semua check harus lulus tanpa `ERROR`. Untuk gate lengkap (sama seperti CI PR), jalankan:

```bash
npm run test:quality
```

### 6. Perintah tes — kapan pakai apa

| Perintah               | Kapan                                                 |
| ---------------------- | ----------------------------------------------------- |
| `npm run test:fast`    | Iterasi selector cepat (tanpa lint/typecheck)         |
| `npm test`             | Suite E2E default (tanpa `@demo`; smoke + regression) |
| `npm run test:smoke`   | Hanya `@smoke`                                        |
| `npm run test:demo`    | Latihan Healer (`@demo` — sengaja gagal)              |
| `npm run test:quality` | Sebelum push / sama dengan CI PR                      |

### 7. Aktifkan 3 MCP Server

Konfigurasi ada di [`.vscode/mcp.json`](../.vscode/mcp.json):

| Server            | Fungsi                                                 |
| ----------------- | ------------------------------------------------------ |
| `playwright`      | Eksplorasi UI (`browser_navigate`, `browser_snapshot`) |
| `playwright-test` | Menjalankan tes (`run_tests`)                          |
| `playwright-qa`   | Requirement, validasi, kegagalan, ringkasan            |

Di Cursor: Settings → MCP → pastikan ketiga server **hijau/connected**.

---

## Alur Harian QA

Pipeline mengikuti [CUSTOM-MCP.md — Agent pipeline checklist](../CUSTOM-MCP.md):

1. `health_check` (playwright-qa)
2. `validate_requirement` (playwright-qa) — atau CLI: `npm run validate:requirement`
3. Planner → `specs/*-test-plan.md`
4. Generator → `src/tests/*.spec.ts`
5. `validate_generated_tests` (playwright-qa) — atau CLI: `npm run validate`
6. `run_tests` (playwright-test)
7. Jika gagal: `get_test_failures` → Healer → `run_tests` (scoped)
8. `get_test_summary` (playwright-qa)

Diagram visual: lihat section "Bagaimana Ini Bekerja?" di [README.md](../README.md).

---

## Validasi Format (Tanpa Buka Agent)

Sebelum jalankan pipeline Cursor, cek format requirement:

```bash
npm run validate:requirement -- requirements/nama-fitur.md
```

- `status: success` → lanjut pipeline
- `error` → perbaiki dulu (lihat Troubleshooting)
- `warn` → bisa lanjut, tapi review saran perbaikan

---

## Walkthrough: Contoh Pertama

Gunakan [`requirements/example-login-extension.md`](../requirements/example-login-extension.md) untuk latihan:

```bash
# 1. Validasi format
npm run validate:requirement -- requirements/example-login-extension.md

# 2. Di Cursor Agent mode, salin prompt dari docs/prompt-cursor-agent.md
#    (bagian "Pipeline lengkap") dengan path example-login-extension.md

# 3. Setelah generate, jalankan tes
npm test

# 4. Lihat laporan
#    - reports/custom-dashboard.html
#    - npx playwright show-report
```

Output yang diharapkan:

- `specs/example-login-extension-test-plan.md` (dibuat Planner)
- `src/tests/ui/auth/login-empty-fields.spec.ts` atau serupa (dibuat Generator)
- Tes SC-01 dan SC-02 jalan; SC-03 (@manual) di-skip

---

## Kamus Istilah

| Untuk QA (Bahasa Indonesia) | Nama di framework (pakai di prompt/file)                |
| --------------------------- | ------------------------------------------------------- |
| Dokumen kebutuhan           | `requirements/*.md` (bukan file `_` atau README)        |
| Test plan                   | `specs/*-test-plan.md`                                  |
| Kode tes                    | `src/tests/**/*.spec.ts`                                |
| Server QA custom            | `playwright-qa`                                         |
| Cek kesehatan               | tool `health_check`                                     |
| Validasi format             | `validate_requirement` / `npm run validate:requirement` |
| Validasi kode tes           | `npm run validate`                                      |
| Agent perencana             | Planner                                                 |
| Agent penulis tes           | Generator                                               |
| Agent perbaikan             | Healer                                                  |
| Koordinator pipeline        | Orchestrator                                            |
| Maintainer framework        | Tim yang maintain `mcp-server/`, CI, parser             |

---

## Troubleshooting `validate_requirement`

| Rule                       | Severity | Perbaikan                                                               |
| -------------------------- | -------- | ----------------------------------------------------------------------- |
| `title_required`           | error    | Tambah baris `# REQ-01: Judul Fitur`                                    |
| `content_required`         | error    | Tambah bullet di `## Kriteria Penerimaan` atau skenario `###`           |
| `scenario_structure`       | error    | Setiap `###` wajib punya `**Langkah:**` dan `**Hasil:**` (bold + colon) |
| `observable_result`        | warn     | Hasil harus menyebut URL, teks, atau visibility — bukan "berjalan baik" |
| `precondition_recommended` | warn     | Tambah `**Prekondisi:**` untuk skenario auth-sensitive                  |
| `manual_reason`            | warn     | Skenario `@manual` perlu alasan jelas di **Hasil**                      |

Detail tool: [CUSTOM-MCP.md — validate_requirement](../CUSTOM-MCP.md).

---

## Troubleshooting `health_check` / `npm run health:check`

| Check             | Status    | Perbaikan                                        |
| ----------------- | --------- | ------------------------------------------------ |
| `node`            | fail      | Install Node.js >= 20                            |
| `mcp_build`       | fail      | `npm run mcp:build`                              |
| `playwright_mcp`  | fail      | `npm install`                                    |
| `playwright_test` | warn/fail | Upgrade `@playwright/test` >= 1.56               |
| `environment`     | fail/warn | Buat `environments/{APP_ENV}.env` dari template  |
| `base_url`        | warn      | Set `BASE_URL` di file env                       |
| `json_results`    | warn      | Normal sebelum tes pertama — jalankan `npm test` |

CLI: `npm run health:check` (setara tool MCP `health_check`).

---

## Troubleshooting `validate_generated_tests` / `npm run validate`

| Rule              | Perbaikan                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| Import rule       | Pakai `import { test } from '@/fixtures/base.fixture'`                    |
| Describe rule     | Bungkus tes dalam `test.describe(...)`                                    |
| Step rule         | Gunakan `test.step(...)` per aksi                                         |
| Traceability rule | Tambah header `// spec:` dan `// seed:` (wajib untuk tes hasil Generator) |

Tes legacy (login, smoke, seed, demo) exempt — lihat [MAINTENANCE.md](../MAINTENANCE.md).

---

## Troubleshooting MCP merah di IDE

1. `npm run mcp:build` — wajib setelah clone
2. Cek [`.vscode/mcp.json`](../.vscode/mcp.json): `playwright-qa` → `node mcp-server/dist/index-mcp.js`
3. Restart MCP di Cursor Settings

---

## Environment: `APP_ENV` vs `ENV_NAME`

| Variable                                              | Fungsi                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `APP_ENV`                                             | Pilih file `environments/{name}.env` (`local`, `dev`, `staging`, `production`) |
| `ENV_NAME`                                            | Label runtime di test (logging)                                                |
| `BASE_URL`                                            | URL aplikasi                                                                   |
| `TEST_USER_EMAIL` / `USERNAME` / `PHONE` / `PASSWORD` | Kredensial QA                                                                  |

Set `APP_ENV=local` saat dev lokal. CI E2E materialize `environments/dev.env` dari GitHub Secrets.

---

## Branch protection (maintainer)

- Required check PR: workflow **Quality Gate** (`quality.yml`)
- E2E (`e2e.yml`): push main / manual — butuh secrets: `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_USERNAME`, `TEST_USER_PASSWORD`, `TEST_USER_PHONE`

---

## Batasan Normal (Bukan Bug)

- **Halaman baru** tanpa POM → Generator butuh 1–2 iterasi (`browser_snapshot` + Heal).
- **`@manual`** → tes di-skip otomatis (CAPTCHA, email nyata).
- **Healer** → maksimal 10 kegagalan per run.
- **Environment** → tiap QA pakai `local.env` sendiri.

---

## Kapan Eskalasi ke Maintainer Framework

Hubungi maintainer framework jika:

- `npm run setup:check` gagal setelah ikuti panduan ini
- MCP server tidak bisa connect setelah `npm run mcp:build`
- `validate_requirement` error pada file yang sudah ikuti template
- Tool MCP mengembalikan error yang tidak ada di Troubleshooting

Bukan tugas maintainer: selector aplikasi salah, halaman belum ada POM, atau bug di aplikasi yang diuji.

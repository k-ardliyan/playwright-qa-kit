# Panduan QA — Bekerja di Laptop Lokal

Panduan setup, pipeline, dan troubleshooting tim QA.

**Referensi**

- [README.md](README.md) — indeks semua dokumen
- [CUSTOM-MCP.md](../CUSTOM-MCP.md) — kontrak tool MCP
- [README.md](../README.md) — diagram alur di root repo
- [FORK-ONBOARDING.md](FORK-ONBOARDING.md) — fork template

## Mulai di Sini

| Langkah                          | Dokumen                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tulis requirement                | [\_TEMPLATE.md](../requirements/_TEMPLATE.md)<br>[writing-requirements.md](writing-requirements.md)                      |
| Rapikan catatan (ChatGPT/Gemini) | [writing-requirements.md → Prompt untuk AI eksternal](writing-requirements.md#prompt-untuk-ai-eksternal-chatgpt--gemini) |
| Pipeline AI (Codex)              | Section `Prompt Siap Pakai` di dokumen ini                                                                               |
| Contoh requirement valid         | [`example-login-extension.md`](../requirements/example-login-extension.md)                                               |

---

<a id="setup-lokal"></a>

## Setup Lokal (Sekali per Mesin)

### 1. Prasyarat

- Node.js **>= 20.19.0** (LTS 20.x recommended)
- Git
- VS Code dengan ekstensi Codex (Primary) atau Cursor

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

**Browser (opsional):** `HEADLESS=true|false` mengatur mode headless default; `SLOW_MO=<ms>` memperlambat aksi browser lewat `launchOptions.slowMo` (berguna saat demo Healer). Nilai dibaca **setelah** `loadEnvironment()` di `playwright.config.ts` — ubah di `local.env`, tidak perlu restart MCP kecuali Anda mengubah `PLAYWRIGHT_CONFIG` atau kredensial. `npm run test:headed` selalu menampilkan browser (override `HEADLESS`). Di CI, `SLOW_MO` dipaksa `0`.

Untuk menjalankan suite ERPKU contoh, salin juga nilai dari [`example/erpku/environments/erpku.env.example`](../example/erpku/environments/erpku.env.example) ke `environments/local.env` (`AUTH_*`, `TEST_USER_PHONE`).

<a id="framework-core-vs-adapter"></a>

### Framework core vs project adapter

|                           | **Path A — template core (disarankan)** | **Path B — ERPKU adapter (demo)**                                                                                     |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Tujuan                    | Latihan pipeline AI penuh               | Demo adapter + smoke; jelajah spec referensi                                                                          |
| App                       | Frontend baru / generic                 | ERPKU reference (`example/erpku/`)                                                                                    |
| `PLAYWRIGHT_CONFIG`       | `playwright.config.ts` (default)        | `example/erpku/playwright.config.ts`                                                                                  |
| **Generate AI**           | `src/tests/*.spec.ts`                   | Spec referensi manual — Generator tidak menulis ke folder adapter                                                     |
| Import fixture (generate) | `@/fixtures/base.fixture`               | —                                                                                                                     |
| Env tambahan              | —                                       | `AUTH_*`, `TEST_USER_PHONE` dari [`erpku.env.example`](../example/erpku/environments/erpku.env.example) → `local.env` |
| Sanity run                | `npm test`                              | `npm run test:erpku-example -- --project=smoke`                                                                       |

Setelah ubah `PLAYWRIGHT_CONFIG` atau kredensial → **restart MCP servers**.

Pipeline AI (Planner → Generator) **selalu** menulis ke `src/tests/` — termasuk latihan [`example-login-extension.md`](../requirements/example-login-extension.md). Path B dipakai untuk menjalankan dan mempelajari suite adapter, bukan generate spec baru via AI.

| Perintah harian              | Layer         | Keterangan                           |
| ---------------------------- | ------------- | ------------------------------------ |
| `npm test`                   | Template core | Seed + property; `@demo` di-exclude  |
| `npm run test:erpku-example` | ERPKU adapter | Smoke + regression (butuh env + app) |

Fork proyek baru: checklist di [FORK-ONBOARDING.md](FORK-ONBOARDING.md).

### 4. Verifikasi setup

```bash
npm run setup:check
```

Semua check harus lulus tanpa `ERROR`. Untuk gate lengkap (sama seperti CI PR), jalankan:

```bash
npm run test:quality
```

### 6. Perintah tes — kapan pakai apa

| Perintah                     | Kapan                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `npm run test:fast`          | Iterasi selector cepat (tanpa lint/typecheck)                      |
| `npm test`                   | Template core — seed spec (tanpa `@demo`)                          |
| `npm run test:erpku-example` | Suite ERPKU lengkap (butuh env + app)                              |
| `npm run test:smoke`         | Hanya `@smoke` (core grep; gunakan `--project=smoke` pada example) |
| `npm run test:demo`          | Latihan Healer — project `demo`, sengaja gagal (`@demo`)           |
| `npm run test:quality`       | Sebelum push / sama dengan CI PR                                   |

### 7. Aktifkan 3 MCP Server

Konfigurasi ada di [`.vscode/mcp.json`](../.vscode/mcp.json):

| Server            | Fungsi                                                 |
| ----------------- | ------------------------------------------------------ |
| `playwright`      | Eksplorasi UI (`browser_navigate`, `browser_snapshot`) |
| `playwright-test` | Menjalankan tes (`run_tests`)                          |
| `playwright-qa`   | Requirement, validasi, kegagalan, ringkasan            |

Di VS Code (Codex): Pastikan file `.vscode/mcp.json` tersedia dan extension mengenali server.
Di Cursor: Settings → MCP → pastikan ketiga server **hijau/connected**.

**Playwright profile:** set `PLAYWRIGHT_CONFIG` di `environments/local.env` (default `playwright.config.ts`; untuk ERPKU adapter gunakan `example/erpku/playwright.config.ts`). Setelah mengubah env, **restart MCP servers** di IDE agar `playwright-test` dan `playwright-qa` membaca profile yang sama.

**CLI vs MCP:** `npm run health:check` dan MCP tool `health_check` keduanya mem-bootstrap env dari repo root; hasil seharusnya selaras setelah restart MCP.

### Playwright CLI vs MCP (Generator)

- **playwright-cli** (preferred): token-efficient, attach via `npx playwright test --debug=cli src/tests/seed.spec.ts` lalu `npx playwright-cli attach tw-XXXX`. Replay langkah skenario dengan `snapshot`, `click`, `fill`, `press`, lalu pakai output TS sebagai basis spec. Jangan `open`/`goto` URL mentah; selalu attach lewat seed test agar bootstrap auth/fixture tetap benar.
- **playwright MCP**: fallback exploratory/healing — `browser_snapshot`, `browser_click`, dll. via server `playwright`.

Instal CLI: `npx playwright-cli --help` (pastikan command tersedia sebelum generate tes halaman baru).

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

Sebelum jalankan pipeline AI (Codex/Cursor), cek format requirement:

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

# 2. Di Codex chat (atau Cursor Agent mode), kirim prompt pipeline dari section "Prompt Siap Pakai" di dokumen ini

# 3. Setelah generate, jalankan tes
npm test

# 4. Lihat laporan
#    - reports/custom-dashboard.html (dashboard modern — errors, test steps, screenshot, video, attachments)
#    - npx playwright show-report
```

Output yang diharapkan:

- `specs/example-login-extension-test-plan.md` (dibuat Planner)
- `src/tests/login-empty-fields.spec.ts` atau serupa (dibuat Generator di `src/tests/`)
- Tes SC-01 dan SC-02 jalan; SC-03 (@manual) di-skip

---

## Prompt Siap Pakai

Gunakan prompt berikut di Codex atau Cursor Agent mode. Ganti `requirements/nama-fitur.md` dengan file Anda.

### Validasi format saja

```
Validasi requirements/nama-fitur.md menggunakan tool validate_requirement di server playwright-qa.
Jika ada error severity, perbaiki file requirement lalu validasi ulang.
Jangan jalankan pipeline - hanya validasi dan perbaikan format.
```

### Pipeline lengkap

```
Jalankan pipeline lengkap untuk requirements/nama-fitur.md:

1. health_check (playwright-qa) - abort jika ada status fail
2. validate_requirement (playwright-qa) - perbaiki error sebelum lanjut
3. Planner: parse_requirement_scenarios + normalize_requirements -> tulis specs/nama-fitur-test-plan.md
3.5. (Opsional) Untuk situs publik: panggil discover_pages (playwright-qa) dengan rootUrl + featureName agar Planner/Generator bisa baca selector-catalog/<feature>/page-map.json dan reuse JSON index selector.
4. Generator: buat kode di src/tests/ (kebab-case .spec.ts, import @/fixtures/base.fixture) dari test plan
5. validate_generated_tests (playwright-qa)
6. run_tests (playwright-test)
7. Jika gagal (<=10): get_test_failures (playwright-qa) -> Healer -> validate_generated_tests -> run_tests scoped
8. get_test_summary (playwright-qa)

Ikuti format requirement di requirements/_TEMPLATE.md.
Return unresolved failures jika ada.
```

### Plan saja

```
Plan test scenarios dari requirements/nama-fitur.md:

1. validate_requirement (playwright-qa)
2. parse_requirement_scenarios + normalize_requirements (playwright-qa)
3. Tulis specs/nama-fitur-test-plan.md dengan tabel: Scenario Name | Steps | Expected Result

Jangan generate kode tes - hanya test plan.
```

### Generate saja

```
Generate Playwright tests dari specs/nama-fitur-test-plan.md:

1. Baca metadata dari normalize_requirements jika perlu
2. Untuk halaman baru: live verification via playwright-cli (preferred) atau browser_* MCP tools
   - Untuk halaman yang sudah ada di selector-catalog/<feature>/<page>.json: baca JSON index, copy primary locator ke POM method. Hanya panggil browser_snapshot bila catalog stale (hash mismatch) atau element tidak ada di catalog.
3. Tulis file di src/tests/ (kebab-case .spec.ts, import @/fixtures/base.fixture)
4. validate_generated_tests (playwright-qa)
```

### Snapshot saja

```
Snapshot halaman https://staging.app/login lalu simpan ke selector-catalog/login/login-form:

1. snapshot_page (playwright-qa) - url=https://staging.app/login, featureName=login, pageName=login-form
2. Baca file selector-catalog/login/login-form.json untuk lihat daftar selector + kandidat fallback
3. Jika perlu crawl banyak halaman, pakai discover_pages sebagai gantinya
```

### Heal saja

```
Heal kegagalan tes:

1. get_test_failures (playwright-qa) dari test-results/results.json
2. Perbaiki file spec yang gagal di src/tests/ (gunakan tracePath/screenshotPath jika ada)
3. validate_generated_tests (playwright-qa)
4. run_tests (playwright-test) hanya untuk file yang diperbaiki
```

### Contoh konkret

```
Jalankan pipeline lengkap untuk requirements/example-login-extension.md.
Ikuti prompt "Pipeline lengkap" di atas.
```

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

<a id="troubleshooting-validate-requirement"></a>

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

<a id="troubleshooting-health-check"></a>

## Troubleshooting `health_check` / `npm run health:check`

| Check             | Status    | Perbaikan                                        |
| ----------------- | --------- | ------------------------------------------------ |
| `node`            | fail      | Install Node.js >= 20.19.0                       |
| `mcp_build`       | fail      | `npm run mcp:build`                              |
| `playwright_mcp`  | fail      | `npm install`                                    |
| `playwright_test` | warn/fail | Upgrade `@playwright/test` >= 1.56               |
| `environment`     | fail/warn | Buat `environments/{APP_ENV}.env` dari template  |
| `base_url`        | warn      | Set `BASE_URL` di file env                       |
| `json_results`    | warn      | Normal sebelum tes pertama — jalankan `npm test` |

CLI: `npm run health:check` — mem-bootstrap env seperti MCP `health_check`; restart MCP setelah ubah `environments/local.env`.

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
3. **VS Code (Codex):** reload window atau restart extension jika MCP server tidak connect
4. **Cursor:** Settings → MCP → restart server; pastikan ketiga server hijau/connected

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

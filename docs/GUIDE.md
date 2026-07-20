# Panduan QA — Bekerja di Laptop Lokal

Panduan setup, pipeline, dan troubleshooting tim QA.

Referensi cepat: [CHEATSHEET.md](CHEATSHEET.md) · [docs/README.md](README.md) · [AGENTS.md](../AGENTS.md)

---

## Mulai di Sini

| Langkah                          | Dokumen                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tulis requirement                | [requirements/\_TEMPLATE.md](../requirements/_TEMPLATE.md) · [writing-requirements.md](writing-requirements.md)          |
| Rapikan catatan (ChatGPT/Gemini) | [writing-requirements.md → Prompt untuk AI eksternal](writing-requirements.md#prompt-untuk-ai-eksternal-chatgpt--gemini) |
| Pipeline AI                      | Section **Prompt Siap Pakai** di dokumen ini                                                                             |
| Contoh requirement valid         | [requirements/example-login-extension.md](../requirements/example-login-extension.md)                                    |

---

## Setup Lokal (Sekali per Mesin)

### 1. Prasyarat

- Node.js **>= 20.19.0** (LTS 20.x recommended)
- Git
- VS Code dengan ekstensi Codex, Cursor, atau Kiro

### 2. Instalasi

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
```

### 3. Environment

```bash
copy environments\local.env.example environments\local.env   # Windows
# cp environments/local.env.example environments/local.env   # Mac/Linux
```

Isi `BASE_URL` dan kredensial tes di `environments/local.env`. Jangan commit file `.env` berisi password.

**Variabel opsional:**

- `HEADLESS=true|false` — mode headless browser (default `true`)
- `SLOW_MO=<ms>` — perlambat aksi browser (berguna saat demo Healer)
- Ubah di `local.env`, tidak perlu restart MCP kecuali mengubah `PLAYWRIGHT_CONFIG` atau kredensial
- `npm run test:headed` selalu menampilkan browser (override `HEADLESS`)

Untuk suite ERPKU contoh, salin juga nilai dari `example/erpku/environments/erpku.env.example` ke `environments/local.env`.

### 4. Verifikasi

```bash
npm run setup:check
npm run health:check
```

Target: semua check hijau (warning di `json_results` adalah normal sebelum test pertama).

---

## Konfigurasi MCP di IDE

| Server            | Fungsi                                                 |
| ----------------- | ------------------------------------------------------ |
| `playwright`      | Eksplorasi UI (`browser_navigate`, `browser_snapshot`) |
| `playwright-test` | Menjalankan tes (`run_tests`)                          |
| `playwright-qa`   | Requirement, validasi, kegagalan, ringkasan, archive   |

**VS Code (Codex):** Utamakan `.mcp.json` di root project. Gunakan `.vscode/mcp.json` hanya bila editor membutuhkan workspace MCP config.

**Cursor / Kiro:** Settings → MCP → pastikan ketiga server connected.

**Playwright profile:** set `PLAYWRIGHT_CONFIG` di `environments/local.env` (default `playwright.config.ts`; untuk ERPKU adapter gunakan `example/erpku/playwright.config.ts`). Setelah mengubah env, restart MCP server di IDE.

---

## Playwright CLI vs MCP (Generator)

- **playwright-cli** (preferred): token-efficient, attach via `npx playwright test --debug=cli src/tests/seed.spec.ts` lalu `npx playwright-cli attach tw-XXXX`. Replay langkah skenario dengan `snapshot`, `click`, `fill`, `press`, lalu pakai output TS sebagai basis spec. Jangan `open`/`goto` URL mentah — selalu attach lewat seed test agar bootstrap auth/fixture tetap benar.
- **playwright MCP**: fallback exploratory/healing — `browser_snapshot`, `browser_click`, dll. via server `playwright`.

Instal CLI: `npx playwright-cli --help` (pastikan command tersedia sebelum generate tes halaman baru).

---

## Alur Harian QA

Pipeline mengikuti kontrak di [AGENTS.md](../AGENTS.md):

1. `health_check` (playwright-qa)
2. `validate_requirement` — atau CLI: `npm run validate:requirement`
3. Planner → `specs/*-test-plan.md` (dengan kolom Role, Auth Context, Type)
4. Generator → `src/tests/*.spec.ts` (satu file per role jika role-aware)
5. `validate_generated_tests` — atau CLI: `npm run validate`
6. `run_tests` (playwright-test)
7. Jika gagal: `get_test_failures` → Healer → `run_tests` (scoped)
8. `get_test_summary` → Reporter → `archive_report`

---

## Validasi Format

Sebelum jalankan pipeline AI, cek format requirement:

```bash
npm run validate:requirement -- requirements/nama-fitur.md
```

- `status: success` → lanjut pipeline
- `error` → perbaiki dulu (lihat Troubleshooting)
- `warn` → bisa lanjut, tapi review saran perbaikan

Warning baru yang mungkin muncul setelah upgrade:

| Warning                        | Artinya                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `role_scope_recommended`       | Auth authenticated tapi tidak ada Role scope — pertimbangkan isi         |
| `access_expectation_missing`   | Role scope diisi tapi Access expectation belum ada                       |
| `failure_scenario_recommended` | Ada kata gagal/error di requirement tapi tidak ada `(@failure)` scenario |

---

## Walkthrough: Contoh Pertama

Gunakan [`requirements/example-login-extension.md`](../requirements/example-login-extension.md) untuk latihan:

```bash
# 1. Validasi format
npm run validate:requirement -- requirements/example-login-extension.md

# 2. Di IDE, kirim prompt pipeline (lihat section Prompt Siap Pakai)

# 3. Jalankan tes
npm test

# 4. Lihat laporan
start reports/custom-dashboard.html   # Windows
npx playwright show-report            # detail trace + screenshot
```

Output yang diharapkan:

- `specs/example-login-extension-test-plan.md` (dibuat Planner)
- `src/tests/login-empty-fields.spec.ts` (dibuat Generator)
- SC-01 dan SC-02 jalan; SC-03 `(@manual)` di-skip

---

## Prompt Siap Pakai

Ganti `requirements/nama-fitur.md` dengan file Anda.

### Validasi format saja

```
Validasi requirements/nama-fitur.md menggunakan tool validate_requirement di server playwright-qa.
Jika ada error severity, perbaiki file requirement lalu validasi ulang.
Jangan jalankan pipeline — hanya validasi dan perbaikan format.
```

### Pipeline lengkap

```
Jalankan pipeline lengkap untuk requirements/nama-fitur.md sesuai kontrak AGENTS.md:

1. Pre-flight dan validasi requirement; berhenti jika ada error.
2. Buat test plan di specs/nama-fitur-test-plan.md (dengan kolom Role, Auth Context, Type).
3. Jika requirement punya Role scope, buat satu file spec per role di src/tests/<fitur>-<role>.spec.ts.
4. Generate spec Playwright memakai @/fixtures/base.fixture.
5. Validasi generated tests sebelum eksekusi.
6. Jalankan tests lewat playwright-test.
7. Jika gagal, ambil failure dari JSON hasil run aktif, heal, validasi ulang, lalu re-run scoped.
8. Buat pipeline report dan archive ke reports/archive/<runId>/.
9. Return summary akhir dan unresolved failures jika ada.

Untuk situs publik, boleh gunakan discover_pages/snapshot_page agar selector-catalog bisa dipakai ulang.
```

### Role-aware pipeline

```
Jalankan pipeline untuk requirements/nama-fitur.md — fitur ini role-aware.
Roles in scope: [tulis role, misal: super-admin, finance, hrd].

1. Validasi requirement; pastikan Role scope dan Access expectation sudah ada.
2. Planner buat scenario per role dengan kolom Role dan Auth Context.
3. Generator buat satu file per role: src/tests/<fitur>-<role>.spec.ts
   - Gunakan test.use({ storageState: '.auth/<role>.json' }) per file.
4. Jalankan semua role files, atau filter dengan: roleFilter: ["<role>"].
5. Report mencakup summaryByRole per role.
6. Archive report setelah selesai.
```

### Plan saja

```
Plan test scenarios dari requirements/nama-fitur.md:

1. validate_requirement (playwright-qa)
2. parse_requirement_scenarios + normalize_requirements (playwright-qa)
3. Tulis specs/nama-fitur-test-plan.md dengan kolom: Scenario Name | Steps | Expected Result | Role | Auth Context | Type
4. Tambah section Coverage Gap untuk scenario yang tidak bisa diplankan.

Jangan generate kode tes — hanya test plan.
```

### Generate saja

```
Generate Playwright tests dari specs/nama-fitur-test-plan.md:

1. Baca kolom Role dan Auth Context per scenario.
2. Jika role-aware, buat satu file per role (src/tests/<fitur>-<role>.spec.ts).
3. Untuk halaman baru: live verification via playwright-cli (preferred) atau browser_* MCP tools.
   Untuk halaman di selector-catalog: baca JSON index, copy primary locator ke POM method.
4. Tulis file di src/tests/ (kebab-case .spec.ts, import @/fixtures/base.fixture).
5. Scenario (@access-restriction): assert penolakan akses — redirect, error message, atau elemen tidak ada.
6. Scenario (@failure): assert pesan error atau state validasi gagal.
7. Scenario (@manual): test.skip(true, 'Manual: <alasan>').
8. validate_generated_tests (playwright-qa).
```

### Heal saja

```
Heal kegagalan tes:

1. get_test_failures (playwright-qa) dari JSON hasil run aktif.
2. Klasifikasikan failure source: app | test | requirement | env | ai_generation.
3. Perbaiki file spec yang gagal di src/tests/ (gunakan tracePath/screenshotPath jika ada).
4. validate_generated_tests (playwright-qa).
5. run_tests (playwright-test) hanya untuk file yang diperbaiki.
```

### Snapshot saja

```
Snapshot halaman https://staging.app/login lalu simpan ke selector-catalog/login/login-form:

1. snapshot_page (playwright-qa) — url, featureName=login, pageName=login-form
2. Baca file selector-catalog/login/login-form.json untuk lihat daftar selector
3. Jika perlu crawl banyak halaman, pakai discover_pages sebagai gantinya
```

---

## Kamus Istilah

| Untuk QA (Bahasa Indonesia) | Nama di framework                                       |
| --------------------------- | ------------------------------------------------------- |
| Dokumen kebutuhan           | `requirements/*.md`                                     |
| Test plan                   | `specs/*-test-plan.md`                                  |
| Kode tes                    | `src/tests/**/*.spec.ts`                                |
| Tes per role                | `src/tests/<fitur>-<role>.spec.ts`                      |
| Auth state per role         | `.auth/<role>.json`                                     |
| Server QA custom            | `playwright-qa`                                         |
| Cek kesehatan               | tool `health_check`                                     |
| Validasi format             | `validate_requirement` / `npm run validate:requirement` |
| Validasi kode tes           | `npm run validate`                                      |
| Arsip laporan               | `archive_report` / `reports/archive/<runId>/`           |
| Agent perencana             | Planner                                                 |
| Agent penulis tes           | Generator                                               |
| Agent perbaikan             | Healer                                                  |
| Agent pelapor               | Reporter                                                |
| Koordinator pipeline        | Orchestrator                                            |
| Maintainer framework        | Tim yang maintain `mcp-server/`, CI, parser             |

---

## Troubleshooting `validate_requirement`

| Rule                           | Severity | Perbaikan                                                               |
| ------------------------------ | -------- | ----------------------------------------------------------------------- |
| `title_required`               | error    | Tambah baris `# REQ-01: Judul Fitur`                                    |
| `content_required`             | error    | Tambah bullet di `## Kriteria Penerimaan` atau skenario `###`           |
| `scenario_structure`           | error    | Setiap `###` wajib punya `**Langkah:**` dan `**Hasil:**`                |
| `observable_result`            | warn     | Hasil harus menyebut URL, teks, atau visibility                         |
| `precondition_recommended`     | warn     | Tambah `**Prekondisi:**` untuk skenario auth-sensitive                  |
| `manual_reason`                | warn     | Skenario `(@manual)` perlu alasan jelas di Hasil                        |
| `role_scope_recommended`       | warn     | Auth authenticated + fitur multi-role → tambah `Role scope` di Metadata |
| `access_expectation_missing`   | warn     | `Role scope` sudah diisi tapi `Access expectation` belum ada            |
| `failure_scenario_recommended` | warn     | Ada kata gagal/error tapi tidak ada skenario `(@failure)`               |

Detail tool: [CUSTOM-MCP.md](../CUSTOM-MCP.md).

---

## Troubleshooting `health_check`

| Check             | Status    | Perbaikan                                        |
| ----------------- | --------- | ------------------------------------------------ |
| `node`            | fail      | Install Node.js >= 20.19.0                       |
| `mcp_build`       | fail      | `npm run mcp:build`                              |
| `playwright_mcp`  | fail      | `npm install`                                    |
| `playwright_test` | warn/fail | Upgrade `@playwright/test` >= 1.56               |
| `environment`     | fail/warn | Buat `environments/{APP_ENV}.env` dari template  |
| `base_url`        | warn      | Set `BASE_URL` di file env                       |
| `json_results`    | warn      | Normal sebelum tes pertama — jalankan `npm test` |

---

## Troubleshooting `validate_generated_tests`

| Rule              | Perbaikan                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| Import rule       | Pakai `import { test } from '@/fixtures/base.fixture'`                    |
| Describe rule     | Bungkus tes dalam `test.describe(...)`                                    |
| Step rule         | Gunakan `test.step(...)` per aksi                                         |
| Traceability rule | Tambah header `// spec:` dan `// seed:` (wajib untuk tes hasil Generator) |

Tes legacy (login, smoke, seed, demo) exempt — lihat [MAINTENANCE.md](../MAINTENANCE.md).

---

## Troubleshooting MCP merah di IDE

1. `npm run mcp:build` — wajib setelah clone atau setelah update MCP tools
2. Cek [`.mcp.json`](../.mcp.json) sebagai source-of-truth project MCP config
3. VS Code (Codex): reload window atau restart extension
4. Cursor/Kiro: Settings → MCP → restart server; pastikan ketiga server connected

---

## Environment: `APP_ENV` vs `ENV_NAME`

| Variable                                              | Fungsi                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `APP_ENV`                                             | Pilih file `environments/{name}.env` (local, dev, staging, prod) |
| `ENV_NAME`                                            | Label runtime di test (logging)                                  |
| `BASE_URL`                                            | URL aplikasi                                                     |
| `TEST_USER_EMAIL` / `USERNAME` / `PHONE` / `PASSWORD` | Kredensial QA                                                    |
| `PLAYWRIGHT_CONFIG`                                   | Path config Playwright (default `playwright.config.ts`)          |

Set `APP_ENV=local` saat dev lokal. CI E2E materialize `environments/dev.env` dari GitHub Secrets.

---

## Batasan Normal (Bukan Bug)

- **Halaman baru** tanpa POM → Generator butuh 1–2 iterasi (`browser_snapshot` + Heal).
- **`(@manual)`** → tes di-skip otomatis (CAPTCHA, email nyata, biometric).
- **Healer** → menggunakan prioritization berbasis pattern; tidak ada cap arbitrer.
- **Role auth file** → `.auth/<role>.json` harus dibuat dulu via auth setup test.
- **Environment** → tiap QA pakai `local.env` sendiri.

---

## Kapan Eskalasi ke Maintainer Framework

Hubungi maintainer framework jika:

- `npm run setup:check` gagal setelah ikuti panduan ini
- `npm run mcp:build` gagal dengan error TypeScript
- Property tests (`npm run test:property`) gagal tanpa ada perubahan di kode QA
- Ada perilaku aneh di pipeline yang tidak tercakup troubleshooting di atas

---

## Branch Protection (Maintainer)

- Required check PR: workflow **Quality Gate** (`quality.yml`)
- E2E (`e2e.yml`): push main / manual — butuh secrets: `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_USERNAME`, `TEST_USER_PASSWORD`, `TEST_USER_PHONE`

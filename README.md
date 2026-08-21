<div align="center">

![Banner](https://capsule-render.vercel.app/api?type=waving&color=0:2E86AB,50:A23B72,100:F18F01&height=220&section=header&text=Playwright%20QA%20Kit&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Requirement%20→%20Test%20Plan%20→%20Auto%20Test%20→%20Heal%20→%20Report&descSize=18&descColor=ffffff&descAlignY=58)

<br/>

[![Version](https://img.shields.io/badge/version-0.2.0--alpha.1-2E86AB?style=for-the-badge&logo=git&logoColor=white)](https://github.com/k-ardliyan/playwright-qa-kit/releases) [![Node.js](https://img.shields.io/badge/node-%3E%3D20.19.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org) [![Playwright](https://img.shields.io/badge/playwright-1.62+-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev) [![TypeScript](https://img.shields.io/badge/typescript-5.9+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.30+-A23B72?style=for-the-badge&logo=protocol&logoColor=white)](https://modelcontextprotocol.io)

<br/>

> **Framework QA berbasis Playwright + AI Agent** — QA mulai dari **requirement**, bukan kode.
> Pipeline terintegrasi: `requirement → test plan → automated test → heal → triage dashboard`.

</div>

---

## 📋 Daftar Isi

- [📋 Daftar Isi](#-daftar-isi)
- [✨ Fitur Utama](#-fitur-utama)
- [🔄 Cara Kerja](#-cara-kerja)
- [🚀 Setup](#-setup)
  - [🌟 Wizard (Recommended untuk Pemula)](#-wizard-recommended-untuk-pemula)
  - [⚙️ Manual (untuk yang Sudah Familiar)](#️-manual-untuk-yang-sudah-familiar)
- [⚡ Quick Start](#-quick-start)
- [📝 Requirement Format](#-requirement-format)
- [🏷️ Scenario Tags](#️-scenario-tags)
- [⌨️ Commands](#️-commands)
  - [🎯 Daily Flow](#-daily-flow)
  - [🔍 Discovery \& Setup](#-discovery--setup)
  - [🧪 Test \& Quality](#-test--quality)
- [🏗️ Architecture](#️-architecture)
- [🔌 MCP Servers](#-mcp-servers)
- [👥 Role-Based Testing](#-role-based-testing)
- [🧩 Integration Recipes](#-integration-recipes)
- [🛠️ Tech Stack](#️-tech-stack)
- [📚 Dokumentasi](#-dokumentasi)
- [🤝 Kontribusi](#-kontribusi)

---

## ✨ Fitur Utama

<div align="center">

|     | Fitur                      | Deskripsi                                                |
| --- | --- | --- |
| 📝  | **Requirement-first**      | QA tulis Markdown, AI generate test                      |
| 🤖  | **5-Phase AI Pipeline**    | Plan → Generate → Execute → Heal → Report                |
| 🔁  | **Healer + Snapshot Loop** | Test gagal → AI fix locator → re-snapshot → rerun        |
| 📊  | **Custom Dashboard**       | Triage Table/Accordion, SOURCE cause, filter columns     |
| 👥  | **Multi-role Auth**        | Role-based storage + OTP/CAPTCHA assist                  |
| 🗺️  | **Coverage Map**           | `list_requirement_status`: req → plan → tests → status   |
| 🔌  | **19 MCP Tools**           | Validate, snapshot, POM, health check, coverage          |
| 🌍  | **Multi-environment**      | Local/staging/production matrix, `APP_ENV` control       |
| 🏷️  | **Capability Tags**        | `@upload` `@download` `@file-content` `@network-assert`  |
| ✅  | **Quality Gates**          | Format/lint/typecheck/unit/property/file-content/network |
| 🔐  | **Encrypted Creds**        | dotenvx auto-encrypt + `env:edit`                        |
| 🧩  | **Integration Recipes**    | NextJS, multi-role, PDF/Excel, network, multi-session    |

</div>

---

## 🔄 Cara Kerja

```
   ┌─────────────────────┐
   │   requirements/*.md│  ← QA tulis requirement
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │   snapshot_page     │  ← Selector catalog per website
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │   AI Planner        │───►│  specs/*-test-plan  │
   └─────────────────────┘    └──────────┬──────────┘
                                         │
                                         ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │   AI Generator      │───►│  tests/*.spec.ts    │
   └─────────────────────┘    └──────────┬──────────┘
                                         │
                                         ▼
   ┌──────────┐    ┌──────────┐    ┌─────────────────────┐
   │ Execute  │───►│  Healer  │───►│  Reporter           │
   │ run test │    │ fix+re-  │    │  custom-dashboard   │
   │          │    │ snapshot │    │  .html              │
   └──────────┘    └──────────┘    └─────────────────────┘
        │                                  │
        ▼                                  ▼
   pass / fail                     triage Table/Accordion
```

> Diorkestrasi oleh **Hermes Agent** via 5 sub-agent — lihat [AGENTS.md](AGENTS.md).

---

## 🚀 Setup

### 🌟 Wizard (Recommended untuk Pemula)

```bash
git clone https://github.com/k-ardliyan/playwright-qa-kit.git
cd playwright-qa-kit
npm install
npm run setup:wizard
```

<details>
<summary>🪄 <b>Klik untuk lihat apa yang dilakukan wizard</b></summary>

<br/>

Wizard memandu kamu langkah demi langkah:

1. ✅ Konfigurasi URL aplikasi dan kredensial test
2. ✅ Install semua dependency dan browser
3. ✅ Build MCP server untuk Hermes Agent
4. ✅ Verifikasi koneksi Hermes + MCP
5. ✅ Setup autentikasi session (`auth.setup.ts`)
6. ✅ Enkripsi kredensial otomatis

Hasil: file `requirements/login.md` siap untuk website kamu.

</details>

### ⚙️ Manual (untuk yang Sudah Familiar)

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
cp config/environments/local.env.example config/environments/local.env   # isi BASE_URL + creds
npm run setup:check && npm run health:check
```

> 🔐 **Credential security** — Nilai `local.env` auto-encrypt ke `encrypted:BA+84DB/...` setelah wizard atau `setup:check` dijalankan. Kunci dekripsi di `~/.dotenvx-keys/playwright-qa-kit/`.

```bash
npm run env:edit              # ganti password / role / OTP mode
npm run auth:setup            # refresh session login
npm run auth:setup:headed     # session + OTP/CAPTCHA di browser
```

> [!TIP]
> **Stuck?** Cek [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) untuk 10 error paling umum + solusinya.

---

## ⚡ Quick Start

```bash
# 1) Preflight + validasi + cetak prompt Hermes
npm run qa:run -- requirements/login.md

# 2) Paste prompt ke Hermes Agent
#    Pipeline: snapshot → Plan → Generate → Execute → Heal → Report

# 3) Dashboard terbuka otomatis
npm run qa:run -- requirements/login.md --open-dashboard
#    atau preview: npx tsx scripts/preview-dashboard.ts
```

| File                            | Peran                                                    |
| --- | --- |
| `requirements/login.md`         | 🎯 **Setup awal** — di-generate wizard, per website kamu |
| `requirements/auth/sample-*.md` | 📚 **Latihan format** — bukan target app                 |
| `requirements/_TEMPLATE.md`     | 📝 Template untuk fitur baru                             |

> Detail pasca-pipeline → [docs/POST-PIPELINE.md](docs/POST-PIPELINE.md)

---

## 📝 Requirement Format

```bash
cp requirements/_TEMPLATE.md requirements/fitur-saya.md
```

<details>
<summary>📄 <b>Lihat contoh requirement minimal</b></summary>

<br/>

```markdown
# REQ-001: Login dengan Email Valid

## Metadata

- **Tags:** #smoke #ui
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login

## Kriteria Penerimaan

- URL berubah ke /dashboard setelah login
- Toast "Welcome" muncul

## Skenario Uji

### SC-01: Login berhasil (@success)

**Langkah:**

1. Isi email valid + password benar
2. Klik tombol Login

**Hasil yang Diharapkan:**

- URL berubah ke /dashboard
- Toast "Welcome" muncul

### SC-02: Login gagal (@failure)

**Langkah:**

1. Isi email valid + password salah
2. Klik tombol Login

**Hasil yang Diharapkan:**

- Muncul pesan error "Email atau password salah"
- Tetap di halaman /login
```

</details>

Validasi: `npm run validate:requirement -- requirements/fitur-saya.md`

Contoh lengkap: [_GOOD_EXAMPLE.md](requirements/_GOOD_EXAMPLE.md) · [_BAD_EXAMPLE.md](requirements/_BAD_EXAMPLE.md)

---

## 🏷️ Scenario Tags

| Tag                     | Kapan Dipakai                                   |
| --- | --- |
| `(@success)`            | Happy path — alur normal berhasil               |
| `(@failure)`            | Negative path — validasi gagal                  |
| `(@access-restriction)` | Role tidak berhak, akses ditolak                |
| `(@manual)`             | Tidak bisa diotomasi (CAPTCHA, OTP, layout PDF) |
| `(@network)`            | Mock request/response                           |
| `(@network-assert)`     | Live observe/assert payload + response          |
| `(@upload)`             | Upload file via fixture (bukan OS picker)       |
| `(@download)`           | Download file via fixture                       |
| `(@file-content)`       | Assert isi PDF teks / header Excel              |
| `(@aria)`               | Accessibility snapshot                          |
| `(@visual)`             | Visual regression (`toHaveScreenshot`)          |
| `(@hybrid)`             | Gabungan capability tags                        |

> Tags bisa digabung: `(@failure @network-assert)` · `(@success @download @file-content)`

Panduan lengkap: [docs/MANUAL-SCENARIOS.md](docs/MANUAL-SCENARIOS.md)

---

## ⌨️ Commands

### 🎯 Daily Flow

| Command                                | Fungsi                                |
| --- | --- |
| `npm run qa:run -- requirements/X.md`  | Preflight + prompt Hermes + dashboard |
| `npm run validate:requirement -- X.md` | Validasi format requirement           |
| `npm run auth:setup`                   | Refresh session login                 |
| `npm run auth:setup:headed`            | Session + OTP/CAPTCHA di browser      |
| `npm run env:edit`                     | Ganti password / role / OTP mode      |

### 🔍 Discovery & Setup

| Command                  | Fungsi                                 |
| --- | --- |
| `npm run setup:wizard`   | Wizard interaktif (recommended)        |
| `npm run setup:check`    | Verifikasi setup lokal                 |
| `npm run health:check`   | Pre-flight pipeline (env + MCP + auth) |
| `npm run env:edit`       | Edit creds / OTP mode                  |
| `npm run snapshot:page`  | Snapshot selector catalog              |
| `npm run discover:pages` | Crawl halaman app                      |

### 🧪 Test & Quality

| Command                   | Fungsi                    |
| --- | --- |
| `npm test`                | Jalankan semua test       |
| `npm run test:smoke`      | Smoke test saja           |
| `npm run test:headed`     | Browser visible (debug)   |
| `npm run test:quality`    | Gate lengkap sebelum push |
| `npm run test:unit`       | Unit tests                |
| `npm run test:property`   | Property tests            |
| `npm run manual:check`    | List scenario `(@manual)` |
| `npm run validate:agents` | Validasi tool registry    |

<details>
<summary>📊 <b>50 npm scripts lengkap</b></summary>

Lihat [docs/CHEATSHEET.md](docs/CHEATSHEET.md) untuk cheat sheet A4 printable.

</details>

---

## 🏗️ Architecture

```text
playwright-qa-kit/
├─ requirements/        ← Input requirement QA (Indonesian & English)
├─ specs/               ← Test plan output (AI Planner)
├─ tests/               ← Playwright Test Workspace (specs, pages, data, adapter)
├─ artifacts/           ← Consolidated runtime output (reports, test-results, selector-catalog)
├─ src/                 ← Framework Core Engine (protected internal boundary)
├─ tools/               ← Maintainer tooling, scripts, validators & MCP server
├─ config/              ← Environment credentials & Playwright configs
├─ docs/                ← Operational & architectural documentation
└─ examples/            ← Reference implementations (ERPku adapter)
```

> 📚 Detail lengkap → [docs/architecture/DIRECTORY-MAP.md](docs/architecture/DIRECTORY-MAP.md) · [DECISIONS.md](docs/architecture/DECISIONS.md) · [LESSONS-LEARNED.md](docs/architecture/LESSONS-LEARNED.md)

---

## 🔌 MCP Servers

| Server                   | Fungsi Utama                                                                   |
| --- | --- |
| 🎭 **`playwright-qa`**   | Requirement parsing, validation, coverage, POM, health check, failure analysis |
| 🎬 **`playwright-test`** | Run dan debug test                                                             |
| 🌐 **`playwright`**      | Browser interaction, eksplorasi UI                                             |

```bash
npm run mcp:build          # build custom QA server
npm run mcp:config         # generate config semua platform
```

> 19 tool lengkap → [CUSTOM-MCP.md](CUSTOM-MCP.md)

---

## 👥 Role-Based Testing

Tambahkan metadata role di requirement:

```markdown
- **Role scope:** super-admin, finance
- **Access expectation:**
  - super-admin: bisa approve
  - finance: bisa approve
  - hrd: tidak bisa membuka halaman finance
```

Generator otomatis membuat file test terpisah per role (`<feature>-<role>.spec.ts`) dengan storage state sesuai dari `.auth/{APP_ENV}/`.

> 🔐 Multi-role auth + OTP/CAPTCHA → [AUTH-CONTEXT-CONVENTION.md](docs/AUTH-CONT-CONVENTION.md) · [CREDENTIALS.md](docs/CREDENTIALS.md)

---

## 🧩 Integration Recipes

<details>
<summary><b>📦 Available Recipes (klik untuk expand)</b></summary>

<br/>

| Recipe                                   | Use Case                                                   |
| --- | --- |
| `playwright.config.nextjs-e2e.recipe.ts` | Next.js app under `/e2e` dengan auth setup + `webServer`   |
| `playwright.role-projects.recipe.ts`     | Multi-role via `buildRoleProjects` + `.auth/<role>.json`   |
| `FILE-UPLOAD-DOWNLOAD.md`                | Fixture-first `@upload` / `@download` — no OS picker       |
| `PDF-EXCEL-CONTENT-ASSERT.md`            | `@file-content` PDF text / Excel headers                   |
| `NETWORK-ASSERT.md`                      | `@network-assert` live payload/response — partial contract |
| `MULTI-SESSION-SYNC.md`                  | Dual `browser.newContext` admin↔user data sync             |

Lihat semua → [docs/recipes/README.md](docs/recipes/README.md)

</details>

---

## 🛠️ Tech Stack

<div align="center">

| Layer         | Tools                                                                                                                                                                                                                             |
| --- | --- |
| **Runtime**   | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)          |
| **Testing**   | ![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=flat-square&logo=playwright&logoColor=white) ![MCP](https://img.shields.io/badge/MCP-000000?style=flat-square&logo=modelcontextprotocol&logoColor=white)       |
| **AI Agent**  | ![Hermes](https://img.shields.io/badge/Hermes_Agent-F18F01?style=flat-square&logo=robot&logoColor=white) ![Claude](https://img.shields.io/badge/Claude-D97757?style=flat-square&logo=claude&logoColor=white)                      |
| **Security**  | ![dotenvx](https://img.shields.io/badge/dotenvx-2E86AB?style=flat-square&logo=dotenv&logoColor=white) ![MCP SDK](https://img.shields.io/badge/MCP_SDK-A23B72?style=flat-square&logo=protocol&logoColor=white)                     |
| **CI/CD**     | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) ![Husky](https://img.shields.io/badge/Husky-000000?style=flat-square&logo=husky&logoColor=white)       |
| **Reporting** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![Custom Dashboard](https://img.shields.io/badge/Custom_Dashboard-F18F01?style=flat-square&logo=googleanalytics&logoColor=white) |

</div>

---

## 📚 Dokumentasi

| Saya ingin...                       | Buka                                                               |
| --- | --- |
| 🆕 Setup QA pertama kali            | [docs/GUIDE.md](docs/GUIDE.md)                                     |
| 📖 Panduan pemula step-by-step      | [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)                 |
| ✏️ Menulis requirement valid        | [docs/WRITING-REQUIREMENTS.md](docs/WRITING-REQUIREMENTS.md)       |
| 🔐 Auth per role + OTP/CAPTCHA      | [docs/AUTH-CONTEXT-CONVENTION.md](docs/AUTH-CONTEXT-CONVENTION.md) |
| 🗝️ Kredensial & multi-role          | [docs/CREDENTIALS.md](docs/CREDENTIALS.md)                         |
| 🔄 Pasca-pipeline                   | [docs/POST-PIPELINE.md](docs/POST-PIPELINE.md)                     |
| 📊 Dashboard triage guide           | [docs/REPORT-GUIDE.md](docs/REPORT-GUIDE.md)                       |
| ✋ Skenario `(@manual)`             | [docs/MANUAL-SCENARIOS.md](docs/MANUAL-SCENARIOS.md)               |
| 🌍 Environment (local/staging/prod) | [docs/ENVIRONMENT-GUIDE.md](docs/ENVIRONMENT-GUIDE.md)             |
| ⌨️ Command cheat sheet              | [docs/CHEATSHEET.md](docs/CHEATSHEET.md)                           |
| 🧩 Integration recipes              | [docs/recipes/README.md](docs/recipes/README.md)                   |
| 🎬 Full E2E walkthrough             | [docs/SAMPLE-E2E-PIPELINE.md](docs/SAMPLE-E2E-PIPELINE.md)         |
| 🍴 Fork ke project lain             | [docs/FORK-ONBOARDING.md](docs/FORK-ONBOARDING.md)                 |
| 🩺 Troubleshooting                  | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)                 |
| 🔌 MCP tool reference               | [CUSTOM-MCP.md](CUSTOM-MCP.md)                                     |
| 🤖 Pipeline agent contract          | [AGENTS.md](AGENTS.md)                                             |
| 🏗️ Architecture decisions           | [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md)   |

---

## 🤝 Kontribusi

Kontribusi welcome! Untuk perubahan besar:

1. 📋 Buka issue dulu — diskusikan perubahan
2. 🌿 Buat branch dari `main` (`feat/...`, `fix/...`, `docs/...`)
3. ✅ Jalankan `npm run test:quality` sebelum push
4. 📝 Update changelog & dokumentasi relevan

> Lihat [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md) untuk WHY di balik constraint framework.

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:F18F01,50:A23B72,100:2E86AB&height=100&section=footer)

**Built with 💖 · 🎭 Playwright + 🤖 Hermes Agent · 2026**

⭐ [Star repo ini](https://github.com/k-ardliyan/playwright-qa-kit) jika membantu workflow QA kamu!

</div>

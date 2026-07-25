# Playwright QA Kit

![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue) ![Node.js](https://img.shields.io/badge/node-%3E%3D20.19.0-339933?logo=node.js&logoColor=white) ![Playwright](https://img.shields.io/badge/playwright-1.62+-45ba63?logo=playwright&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-6.x-3178c6?logo=typescript&logoColor=white)

> **⚠️ Prasyarat:** Node.js **>= 20.19.0** (cek: `node --version`), Git, dan **Hermes Agent**. Cek dulu sebelum lanjut ke wizard — lihat [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) untuk panduan lengkap.

Framework Playwright berbantuan AI untuk alur **requirement → test plan → automated test → report**. QA mulai dari kebutuhan pengujian, bukan dari kode.

---

## Cara Kerja

```
requirements/*.md  →  test plan (AI)  →  spec Playwright (AI)  →  run  →  heal  →  report
```

Jika test gagal, framework mendukung alur failure → heal → rerun secara terintegrasi.

---

## Setup

### 🚀 Setup via Wizard (Direkomendasikan untuk QA Baru)

Untuk QA yang baru clone/download repo ini, gunakan wizard interaktif:

```bash
npm install
npm run setup:wizard
```

Wizard akan membimbing kamu langkah demi langkah:

- Konfigurasi URL aplikasi dan kredensial test
- Install semua dependency dan browser
- Build MCP server untuk Hermes Agent
- Verifikasi koneksi Hermes + MCP di Hermes
- Setup autentikasi session (auth.setup.ts)
- Enkripsi kredensial secara otomatis

### Setup Manual (Opsional)

Jika kamu sudah familiar dengan framework ini:

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
cp environments/local.env.example environments/local.env
# Isi BASE_URL dan kredensial test di local.env
npm run setup:check
npm run health:check
```

### Keamanan Kredensial

Framework memakai `dotenvx` untuk enkripsi otomatis. Setelah wizard atau `setup:check` dijalankan, nilai di `local.env` berubah menjadi `encrypted:BA+84DB/...` — ini **normal dan aman**. Kunci dekripsi disimpan di `~/.dotenvx-keys/playwright-qa-kit/`.

```bash
# Ganti password / tambah / hapus role
npm run env:edit

# Refresh session login
npm run auth:setup
# OTP / CAPTCHA di browser:
npm run auth:setup:headed
```

Panduan lengkap: **[docs/CREDENTIALS.md](docs/CREDENTIALS.md)**.

> **Stuck di setup?** Cek [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) untuk 10 error paling umum + solusinya. Atau mulai dari panduan pemula di [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

---

## Quick Start

Setelah `setup:wizard` selesai, framework menulis **`requirements/login.md`**
untuk **website kamu** (bukan sample). Locator beda tiap app → pipeline
wajib `snapshot_page` dulu.

```bash
# 1) Preflight + validasi + prompt Hermes (termasuk snapshot_page)
npm run qa:run -- requirements/login.md

# 2) Paste prompt ke Hermes Agent
# Pipeline: snapshot catalog → Plan → Generate → Execute → Heal → Report

# 3) Dashboard ditulis ke reports/custom-dashboard.html
#    lalu dibuka otomatis oleh qa-run --open-dashboard (skip via --no-open-dashboard)
#    Preview tanpa e2e: npx tsx scripts/preview-dashboard.ts → reports/preview/{local,ci}.html
```

- **REAL setup awal:** `requirements/login.md`
- **SAMPLE format:** `requirements/sample-*.md` (latihan saja)

Detail pasca-pipeline: **[docs/POST-PIPELINE.md](docs/POST-PIPELINE.md)**.

---

## Alur kerja QA

### 1. Tulis requirement

Salin template dan isi bagian wajib:

```bash
cp requirements/_TEMPLATE.md requirements/nama-fitur.md
```

Format minimal yang harus ada:

```markdown
# REQ-001: Nama Fitur

## Metadata

- **Tags:** #smoke #ui
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login

## Kriteria Penerimaan

- Kondisi observable 1
- Kondisi observable 2

## Skenario Uji

### SC-01: Nama Skenario (@success)

**Prekondisi:** kondisi awal

**Langkah:**

1. Langkah pertama
2. Langkah kedua

**Hasil:**

- URL berubah ke /dashboard
- Elemen X terlihat di layar
```

Gunakan tag tipe scenario di judul `### SC-XX`:

| Tag                     | Artinya                                   |
| ----------------------- | ----------------------------------------- |
| `(@success)`            | Happy path                                |
| `(@failure)`            | Negative path / validasi gagal            |
| `(@access-restriction)` | Role tidak berhak, akses ditolak          |
| `(@manual)`             | Tidak bisa diotomasi (CAPTCHA, OTP, dsb.) |

### 2. Validasi requirement

```bash
npm run validate:requirement -- requirements/nama-fitur.md
# Target: Score 100/100
```

Error umum:

| Error                | Perbaikan                                                |
| -------------------- | -------------------------------------------------------- |
| `title_required`     | Baris pertama harus `# REQ-XXX: Judul Fitur`             |
| `scenario_structure` | Setiap `### SC-XX` butuh `**Langkah:**` dan `**Hasil:**` |
| `observable_result`  | Hasil harus menyebut URL / teks / elemen visible         |

### 3. Jalankan pipeline

Buka **Hermes Agent** dan gunakan prompt:

> Jalankan pipeline lengkap untuk `requirements/nama-fitur.md` sesuai kontrak `AGENTS.md`: validasi requirement, buat test plan, generate test, run, heal jika gagal, lalu return summary dan unresolved failures.

### 4. Review hasil

Setelah pipeline selesai:

| Kondisi                       | Tindakan                                            |
| ----------------------------- | --------------------------------------------------- |
| Semua pass                    | Selesai — commit / push                             |
| Ada heal, semua akhirnya pass | Review perubahan healer, lalu push                  |
| Ada unresolved failure        | Cek requirement, selector, atau environment; ulangi |

---

## Command Utama

| Command                                | Fungsi                                                 |
| -------------------------------------- | ------------------------------------------------------ |
| `npm run qa:run -- requirements/X.md`  | Preflight + validasi + cetak prompt Hermes             |
| `npm run setup:check`                  | Verifikasi setup lokal                                 |
| `npm run health:check`                 | Pre-flight sebelum pipeline                            |
| `npm run validate:requirement -- X.md` | Validasi format requirement                            |
| `npm run manual:check`                 | List scenario `(@manual)` yang harus dijalankan manual |
| `npm test`                             | Jalankan semua test                                    |
| `npm run test:smoke`                   | Jalankan smoke test saja                               |
| `npm run test:headed`                  | Test dengan browser terlihat (debug)                   |
| `npm run test:quality`                 | Gate lengkap sebelum push / PR                         |

---

## Struktur Folder

| Folder / File               | Isi                                       |
| --------------------------- | ----------------------------------------- |
| `requirements/`             | Input requirement yang ditulis QA         |
| `requirements/_TEMPLATE.md` | Template requirement                      |
| `specs/`                    | Test plan output dari AI Planner          |
| `src/tests/`                | Spec Playwright output dari AI Generator  |
| `reports/`                  | Dashboard, summary, dan archive report    |
| `environments/`             | Konfigurasi environment (URL, kredensial) |
| `docs/`                     | Dokumentasi operasional lengkap           |
| `AGENTS.md`                 | Kontrak pipeline agent (source of truth)  |
| `CUSTOM-MCP.md`             | Referensi tool MCP                        |

---

## Artefak: Siapa yang Membuat Apa

| Artefak                         | Dibuat oleh  | QA perlu apa                                  |
| ------------------------------- | ------------ | --------------------------------------------- |
| `requirements/*.md`             | QA           | Tulis dan review                              |
| `specs/*-test-plan.md`          | AI Planner   | Review scenario                               |
| `src/tests/*.spec.ts`           | AI Generator | Jalankan, review bila perlu                   |
| `reports/custom-dashboard.html` | Reporter     | Triage Table/Accordion, SOURCE, Evidence card |
| `reports/test-summary.json`     | Reporter     | Dipakai tooling / agent                       |

---

## MCP Server

Framework ini menyediakan tiga MCP server untuk AI agent:

| Server            | Fungsi                                                   |
| ----------------- | -------------------------------------------------------- |
| `playwright-qa`   | Requirement parsing, validasi, failure analysis, summary |
| `playwright-test` | Menjalankan test                                         |
| `playwright`      | Browser interaction, eksplorasi UI                       |

Generate konfigurasi MCP untuk AI client Anda:

```bash
npm run mcp:config              # Semua platform sekaligus
npm run mcp:config -- --platform cursor
npm run mcp:config -- --platform kiro
```

Platform yang didukung: GitHub Copilot, Claude, Cursor, Kiro, OpenAI Codex.

---

## Role-Based Testing

Jika fitur berbeda per role bisnis (super-admin, finance, hrd, dsb.), tambahkan metadata opsional di requirement:

```markdown
- **Role scope:** super-admin, finance
- **Access expectation:** super-admin: bisa approve; finance: bisa approve; hrd: tidak bisa mengakses
```

Generator akan membuat file test terpisah per role (`src/tests/<feature>-<role>.spec.ts`) dan memakai storage state yang sesuai (`.auth/<role>.json`).

Lihat `docs/AUTH-CONTEXT-CONVENTION.md` untuk setup auth per role.

---

## Template Core vs ERPKU Reference Adapter

| Jalur                   | Fungsi                            | Kapan dipakai                                |
| ----------------------- | --------------------------------- | -------------------------------------------- |
| Template Core           | Flow utama framework              | Default — onboarding dan flow generik        |
| ERPKU Reference Adapter | Contoh implementasi adapter nyata | Referensi untuk project-specific integration |

Generated test dari Template Core masuk ke `src/tests/`. Contoh adapter ada di `example/erpku/`.

---

## Dokumentasi

| Saya ingin...                        | Buka ini                          |
| ------------------------------------ | --------------------------------- |
| Setup QA pertama kali                | `docs/GUIDE.md`                   |
| Menulis requirement yang valid       | `docs/writing-requirements.md`    |
| Tipe skenario dan role-aware testing | `requirements/README.md`          |
| Setup auth per role                  | `docs/AUTH-CONTEXT-CONVENTION.md` |
| Fork repo ini ke project lain        | `docs/FORK-ONBOARDING.md`         |
| Referensi tool MCP                   | `CUSTOM-MCP.md`                   |
| Kontrak pipeline agent               | `AGENTS.md`                       |

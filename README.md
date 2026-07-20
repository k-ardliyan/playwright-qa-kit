# Playwright QA Kit

![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue) ![Node.js](https://img.shields.io/badge/node-%3E%3D20.19.0-339933?logo=node.js&logoColor=white) ![Playwright](https://img.shields.io/badge/playwright-1.61+-45ba63?logo=playwright&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-6.x-3178c6?logo=typescript&logoColor=white)

Framework Playwright berbantuan AI untuk alur **requirement → test plan → automated test → report**. QA mulai dari kebutuhan pengujian, bukan dari kode.

---

## Cara Kerja

```
requirements/*.md  →  test plan (AI)  →  spec Playwright (AI)  →  run  →  heal  →  report
```

Jika test gagal, framework mendukung alur failure → heal → rerun secara terintegrasi.

---

## Setup

```bash
# Install
npm install
npx playwright install --with-deps chromium
npm run mcp:build

# Siapkan environment
cp environments/local.env.example environments/local.env
# Isi BASE_URL dan kredensial test di local.env

# Verifikasi
npm run setup:check
npm run health:check
```

### Keamanan kredensial

Framework memakai `dotenvx` untuk enkripsi otomatis. Saat `npm test` atau `setup:check` dijalankan, kredensial di `local.env` dienkripsi dan kunci dekripsi dipindahkan ke luar project (`~/.dotenvx-keys/playwright-qa-kit/`).

Untuk edit ulang nilai di `local.env`:

```bash
# Salin .env.keys ke environments/, lalu dekripsi
npx @dotenvx/dotenvx decrypt -f environments/local.env
# Setelah selesai edit, jalankan setup:check agar otomatis diamankan kembali
npm run setup:check
```

---

## Quick Start

```bash
# Jalankan pipeline penuh dari satu requirement
npm run qa:run -- requirements/example-login-extension.md

# Hasilnya: pre-flight → validasi → prompt agent → opsional smoke test
```

Setelah berhasil, buka laporan:

```bash
# Dashboard ringkas
start reports/custom-dashboard.html

# Report Playwright lengkap (trace, screenshot, step detail)
npx playwright show-report
```

---

## Workflow Harian QA

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

Buka AI agent (Claude, Cursor, Kiro, dsb.) dan gunakan prompt:

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
| `npm run qa:run -- requirements/X.md`  | Happy path 1-command (pre-flight + validate + prompt)  |
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

| Artefak                         | Dibuat oleh  | QA perlu apa                |
| ------------------------------- | ------------ | --------------------------- |
| `requirements/*.md`             | QA           | Tulis dan review            |
| `specs/*-test-plan.md`          | AI Planner   | Review scenario             |
| `src/tests/*.spec.ts`           | AI Generator | Jalankan, review bila perlu |
| `reports/custom-dashboard.html` | Reporter     | Baca status test            |
| `reports/test-summary.json`     | Reporter     | Dipakai tooling / agent     |

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

| Saya ingin...                         | Buka ini                          |
| ------------------------------------- | --------------------------------- |
| Setup QA pertama kali                 | `docs/GUIDE.md`                   |
| Menulis requirement yang valid        | `docs/writing-requirements.md`    |
| Tipe skenario dan role-aware testing  | `requirements/README.md`          |
| Setup auth per role                   | `docs/AUTH-CONTEXT-CONVENTION.md` |
| Memahami keputusan QA setelah report  | `docs/QA-DECISION-MODEL.md`       |
| Klasifikasi failure (app/test/env/AI) | `docs/FAILURE-TRIAGE.md`          |
| Baseline dan regression testing       | `docs/BASELINE-REGRESSION.md`     |
| Indeks semua dokumen                  | `docs/README.md`                  |
| Fork repo ini ke project lain         | `docs/FORK-ONBOARDING.md`         |
| Referensi tool MCP                    | `CUSTOM-MCP.md`                   |
| Kontrak pipeline agent                | `AGENTS.md`                       |

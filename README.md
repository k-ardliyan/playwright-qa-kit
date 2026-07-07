# 🚀 Playwright QA Kit

![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue) ![Node.js](https://img.shields.io/badge/node-%3E%3D20.19.0-339933?logo=node.js&logoColor=white) ![Playwright](https://img.shields.io/badge/playwright-1.61+-45ba63?logo=playwright&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-6.x-3178c6?logo=typescript&logoColor=white) ![QA Workflow](https://img.shields.io/badge/workflow-requirement--first-purple) ![AI Assisted](https://img.shields.io/badge/AI-assisted-orange)

> **AI-assisted Playwright framework untuk tim QA yang ingin bergerak dari requirement → test plan → automated test → report dengan lebih cepat, lebih rapi, dan lebih mudah dibaca.**
>
> Repo ini dirancang agar QA tidak perlu mulai dari kode. Anda mulai dari **kebutuhan pengujian**, lalu AI dan framework membantu mengubahnya menjadi **scenario**, **Playwright test**, **healing flow**, dan **laporan hasil uji**.
>
> **Status singkat:** requirement-first • QA-friendly • MCP-ready • report-driven • heal-ready

---

## Kenapa Repo Ini Penting untuk QA?

Framework ini membantu QA fokus pada hal yang paling bernilai:

- **apa yang harus diuji**,
- **hasil yang diharapkan**,
- **risiko bisnis**,
- **cakupan scenario**,
- bukan tersesat dulu di locator dan boilerplate code.

Yang Anda dapatkan:

- requirement-first workflow,
- AI-assisted planning dan generation,
- Playwright execution yang siap pakai,
- failure analysis + healing flow,
- report visual yang enak dibaca QA dan stakeholder.

**Cocok untuk:**

- QA non-code / semi-code,
- QA automation,
- lead QA / test architect,
- PM / BA / stakeholder yang ingin membaca hasil test dengan cepat.

---

## Mulai di Sini dalam 5 Menit

Kalau Anda baru pertama kali buka repo ini, lakukan ini dulu:

1. Install dependency:
   ```bash
   npm install
   npx playwright install --with-deps chromium
   npm run mcp:build
   ```
2. Siapkan environment:
   - salin `environments/local.env.example` → `environments/local.env`
   - isi `BASE_URL` dan akun test
3. Verifikasi setup:
   ```bash
   npm run setup:check
   npm run health:check
   ```
4. **Jalankan pipeline happy path** (1 command):
   ```bash
   npm run qa:run -- requirements/example-login-extension.md
   ```
   Command ini otomatis: pre-flight → validate requirement → print prompt siap copy-paste ke AI agent → opsional run smoke test.
5. Buka panduan utama QA:
   - [docs/GUIDE.md](docs/GUIDE.md)
   - [docs/CHEATSHEET.md](docs/CHEATSHEET.md) (1 halaman printable)

**Target sukses pertama:**

- setup sehat,
- `npm run qa:run -- requirements/example-login-extension.md` exit 0,
- prompt ter-print dan bisa di-paste ke agent,
- report bisa dibuka.

---

## Daftar Isi

### Overview

- [Apa Itu Framework Ini?](#apa-itu-framework-ini)
- [Siapa yang Harus Memakai Ini?](#siapa-yang-harus-memakai-ini)
- [Workflow QA dalam Satu Gambar](#workflow-qa-dalam-satu-gambar)

### Start Here

- [Quick Start QA](#quick-start-qa)
- [Perbedaan Template Core vs ERPKU Reference Adapter](#perbedaan-template-core-vs-erpku-reference-adapter)
- [Artefak: Mana yang Ditulis QA dan Mana yang Dihasilkan AI](#artefak-mana-yang-ditulis-qa-dan-mana-yang-dihasilkan-ai)

### Daily Use

- [Command yang Paling Sering Dipakai QA](#command-yang-paling-sering-dipakai-qa)
- [Cara Membaca Hasil Test](#cara-membaca-hasil-test)
- [Checklist Harian QA](#checklist-harian-qa)

### Learn the System

- [Mapping STLC ke Struktur Repo](#mapping-stlc-ke-struktur-repo)
- [Struktur Folder yang Wajib Dipahami QA](#struktur-folder-yang-wajib-dipahami-qa)
- [Mode AI dan MCP untuk QA](#mode-ai-dan-mcp-untuk-qa)

### Docs & Verification

- [Peta Dokumentasi: Buka File yang Mana?](#peta-dokumentasi-buka-file-yang-mana)
- [Quality Gates dan Verifikasi](#quality-gates-dan-verifikasi)
- [FAQ untuk QA](#faq-untuk-qa)

### Flow Harian (Detail)

- [Flow Harian QA — Step by Step](#flow-harian-qa--step-by-step)

### Integration Layer

- [Universal AI Agent Integration Layer](#universal-ai-agent-integration-layer)

---

## Apa Itu Framework Ini?

Framework ini adalah **Playwright QA framework dengan bantuan AI** untuk mempercepat proses end-to-end berikut:

1. QA menulis **requirement**,
2. AI menyusun **test plan**,
3. AI menghasilkan **Playwright test**,
4. runner menjalankan test,
5. failure dibaca dan bisa di-**heal**,
6. hasilnya tampil dalam **report** yang bisa dibaca cepat.

Framework ini bukan sekadar kumpulan script. Ini adalah **alur kerja QA** yang sengaja dibentuk supaya requirement, planning, execution, healing, dan reporting saling terhubung.

---

## Siapa yang Harus Memakai Ini?

### 1. QA non-code / semi-code

Gunakan repo ini bila Anda ingin fokus menulis requirement dan scenario, lalu minta agent membantu generate dan heal.

### 2. QA automation

Gunakan repo ini bila Anda ingin mempercepat penulisan test Playwright tanpa kehilangan struktur dan traceability.

### 3. Maintainer / integrator

Gunakan repo ini bila Anda ingin menjadikan framework ini template untuk project lain melalui flow adapter / fork.

---

## Workflow QA dalam Satu Gambar

```mermaid
flowchart LR
  A[QA menulis requirement<br/>requirements/*.md] --> B[Validate requirement]
  B --> C[AI membuat test plan<br/>specs/*-test-plan.md]
  C --> D[AI generate Playwright test<br/>src/tests/*.spec.ts]
  D --> E[Run tests]
  E --> F{Pass?}
  F -- Ya --> G[Review reports<br/>reports/*]
  F -- Tidak --> H[Read failures<br/>get_test_failures]
  H --> I[Heal dan rerun scoped tests]
  I --> E
```

**Makna flow ini:**

- QA mulai dari **requirement**,
- bukan dari `.spec.ts`.
- AI membantu memecah requirement menjadi plan lalu code.
- Jika gagal, framework mendukung alur **failure → heal → rerun**.

---

## Quick Start QA

### 1. Clone repo

```bash
git clone https://github.com/k-ardliyan/playwright-qa-kit.git
cd playwright-qa-kit
```

### 2. Install

```bash
npm install
npx playwright install --with-deps chromium
npm run mcp:build
```

### 3. Setup environment & Keamanan Kredensial (Secrets)

Untuk mencegah kebocoran kredensial ke Git atau terintip oleh AI Agent, framework ini menggunakan **`dotenvx`** untuk mengenkripsi file `.env` secara otomatis:

- Salin `environments/local.env.example` menjadi `environments/local.env`.
- Isi `BASE_URL` dan kredensial test Anda dalam teks biasa (plaintext).
- Pastikan project MCP config tersedia di `.mcp.json` (root repo); `.vscode/mcp.json` hanya untuk kompatibilitas editor bila perlu.
- **Enkripsi & Proteksi Otomatis**: Saat Anda menjalankan tes (`npm test`) atau pengecekan setup (`npm run setup:check`), sistem akan mendeteksi kredensial baru, mengenkripsinya di file `.env` Anda, dan memindahkan kunci dekripsi `.env.keys` secara otomatis ke folder aman di luar proyek (`~/.dotenvx-keys/playwright-qa-kit/.env.keys` — atau `C:\Users\<Username>\.dotenvx-keys\playwright-qa-kit\.env.keys` di Windows).
- **Cara Dekripsi Manual (Jika Ingin Edit)**:
  Jika Anda ingin mendekripsi file kembali ke plaintext untuk mengedit nilainya, Anda bisa menyalin berkas `.env.keys` dari folder aman komputer Anda kembali ke folder `environments/`, lalu jalankan:
  ```bash
  npx @dotenvx/dotenvx decrypt -f environments/local.env
  ```
  _(Setelah selesai mengedit, cukup jalankan `npm run setup:check` kembali agar sistem otomatis mengamankannya lagi!)_

### 4. Verifikasi setup

```bash
npm run setup:check
npm run health:check
```

### 5. Validasi requirement (atau pakai qa:run happy path)

```bash
# Cara tradisional: validate manual
npm run validate:requirement -- requirements/example-login-extension.md

# Cara single-command: pre-flight + validate + print prompt agent
npm run qa:run -- requirements/example-login-extension.md
```

### 6. Jalankan test utama

```bash
npm test
```

### 7. Buka hasilnya

- [reports/custom-dashboard.html](reports/custom-dashboard.html)
- atau:
  ```bash
  npx playwright show-report
  ```

Untuk panduan operasional lengkap, lanjut ke:

- [docs/GUIDE.md](docs/GUIDE.md)

---

## Perbedaan Template Core vs ERPKU Reference Adapter

Repo ini punya dua konteks penting:

| Jalur                       | Fungsi                            | Kapan dipakai                                               |
| --------------------------- | --------------------------------- | ----------------------------------------------------------- |
| **Template Core**           | Flow utama framework              | Saat Anda ingin memakai kerangka umum repo ini              |
| **ERPKU Reference Adapter** | Contoh implementasi adapter nyata | Saat Anda ingin melihat contoh project-specific integration |

### Template Core

- konfigurasi default,
- generated test masuk ke [src/tests/](src/tests/),
- cocok untuk onboarding dan flow generik.

### ERPKU Reference Adapter

- contoh adapter nyata di [example/erpku/](example/erpku/),
- berguna untuk referensi implementasi,
- tidak menjadi target default generator.

Detail operasionalnya ada di:

- [docs/GUIDE.md](docs/GUIDE.md)
- [docs/FORK-ONBOARDING.md](docs/FORK-ONBOARDING.md)

---

## Artefak: Mana yang Ditulis QA dan Mana yang Dihasilkan AI

| Artefak                         | Dibuat oleh             | Fungsi              | Aksi QA                      |
| ------------------------------- | ----------------------- | ------------------- | ---------------------------- |
| `requirements/*.md`             | QA                      | Kebutuhan pengujian | Tulis / review               |
| `specs/*-test-plan.md`          | AI Planner              | Test plan detail    | Review scenario              |
| `src/tests/*.spec.ts`           | AI Generator / engineer | Script Playwright   | Jalankan / review bila perlu |
| `reports/custom-dashboard.html` | Runner / reporter       | Dashboard hasil     | Baca status test             |
| `reports/test-summary.json`     | Reporter                | Summary terstruktur | Dipakai tooling / agent      |

### Kenapa foldernya `requirements/`, bukan `skenario/`?

Karena file di sana adalah **input awal**. Satu requirement bisa menghasilkan banyak scenario. Scenario hasil AI baru muncul di [specs/](specs/).

---

## Command yang Paling Sering Dipakai QA

Gunakan command ini sebagai paket inti QA:

```bash
# Happy path 1-command (paling sering dipakai pemula)
npm run qa:run -- requirements/nama-fitur.md

# Verifikasi setup lokal
npm run setup:check
npm run health:check

# Validasi requirement
npm run validate:requirement -- requirements/nama-fitur.md

# List skenario (@manual) yang harus dijalankan manual
npm run manual:check

# Jalankan test utama
npm test

# Jalankan smoke test
npm run test:smoke

# Jalankan browser terlihat
npm run test:headed

# Jalankan quality gate lengkap
npm run test:quality
```

### Kapan dipakai?

| Command                               | Kegunaan                                                               |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `npm run qa:run -- X`                 | **happy path 1-command**: pre-flight + validate + print prompt + smoke |
| `npm run setup:check`                 | memastikan setup dasar siap                                            |
| `npm run health:check`                | memastikan pre-flight sehat                                            |
| `npm run validate:requirement -- ...` | memastikan requirement valid sebelum pipeline                          |
| `npm run manual:check`                | list semua skenario `(@manual)` yang harus dijalankan manual           |
| `npm test`                            | menjalankan suite utama                                                |
| `npm run test:smoke`                  | verifikasi alur paling penting                                         |
| `npm run test:headed`                 | debug dengan browser terlihat                                          |
| `npm run test:quality`                | gate lengkap sebelum push / PR                                         |

**Referensi exit code** setiap command: [docs/EXIT-CODES.md](docs/EXIT-CODES.md)

Perintah lanjutan tetap ada di:

- [docs/GUIDE.md](docs/GUIDE.md)

---

## Cara Membaca Hasil Test

### 1. Dashboard QA-friendly

File:

- [reports/custom-dashboard.html](reports/custom-dashboard.html)

Cocok untuk:

- ringkasan pass/fail,
- baca cepat oleh QA,
- review singkat ke stakeholder.

### 2. Report Playwright detail

Jalankan:

```bash
npx playwright show-report
```

Cocok untuk:

- lihat step detail,
- trace,
- screenshot,
- attachment,
- investigasi failure teknis.

### 3. Artifacts untuk debugging

Folder umum:

- `reports/`
- `test-results/`

### 4. Summary terstruktur

File:

- [reports/test-summary.json](reports/test-summary.json)

Digunakan oleh tooling/agent untuk membaca total pass/fail/skipped.

---

## Checklist Harian QA

### Sebelum mulai

- [ ] environment target benar
- [ ] `npm run mcp:build` sukses
- [ ] MCP server aktif di IDE
- [ ] `npm run health:check` sehat

### Saat menulis requirement

- [ ] pakai [requirements/\_TEMPLATE.md](requirements/_TEMPLATE.md)
- [ ] judul pakai format `# REQ-XXX: Nama Fitur`
- [ ] `## Metadata` terisi
- [ ] `## Kriteria Penerimaan` terisi
- [ ] setiap scenario punya `**Langkah:**` dan `**Hasil:**`

### Sebelum minta agent generate

- [ ] `npm run validate:requirement -- requirements/nama-fitur.md` lulus

### Setelah run test

- [ ] failure bisa dibaca dari JSON hasil run aktif
- [ ] dashboard report terbentuk
- [ ] summary report terbentuk

---

## Mapping STLC ke Struktur Repo

| Tahap STLC                | Arti                      | Artefak Repo                         |
| ------------------------- | ------------------------- | ------------------------------------ |
| Requirement Analysis      | menentukan apa yang diuji | [requirements/](requirements/)       |
| Test Design               | menyusun scenario / plan  | [specs/](specs/)                     |
| Test Implementation       | menulis script test       | [src/tests/](src/tests/)             |
| Test Execution            | menjalankan test          | `npm test`, Playwright, MCP          |
| Defect / Failure Analysis | membaca kegagalan         | `get_test_failures`, `test-results/` |
| Test Reporting            | membaca hasil akhir       | [reports/](reports/)                 |

Ini penting supaya QA paham repo ini mengikuti flow kerja testing yang natural, bukan sekadar kumpulan file otomatisasi.

---

## Struktur Folder yang Wajib Dipahami QA

| Folder / File                                                                      | Fungsi                    | Peran untuk QA                    |
| ---------------------------------------------------------------------------------- | ------------------------- | --------------------------------- |
| [docs/GUIDE.md](docs/GUIDE.md)                                                     | panduan QA utama          | dokumen pertama yang wajib dibaca |
| [docs/README.md](docs/README.md)                                                   | indeks dokumen            | navigasi semua docs               |
| [requirements/](requirements/)                                                     | input kebutuhan pengujian | tempat QA menulis requirement     |
| [requirements/\_TEMPLATE.md](requirements/_TEMPLATE.md)                            | template requirement      | format standar                    |
| [requirements/example-login-extension.md](requirements/example-login-extension.md) | contoh valid              | referensi requirement             |
| [specs/](specs/)                                                                   | output plan               | hasil planner                     |
| [src/tests/](src/tests/)                                                           | output test               | hasil generator / test executable |
| [reports/](reports/)                                                               | output report             | hasil yang dibaca QA              |
| [environments/](environments/)                                                     | konfigurasi env           | URL dan kredensial                |
| [CUSTOM-MCP.md](CUSTOM-MCP.md)                                                     | kontrak tool MCP          | referensi teknis                  |
| [AGENTS.md](AGENTS.md)                                                             | kontrak pipeline agent    | source of truth orkestrasi        |

---

## Mode AI dan MCP untuk QA

Framework ini mendukung agent lewat 3 server MCP:

| Server            | Fungsi                                             |
| ----------------- | -------------------------------------------------- |
| `playwright`      | browser interaction / eksplorasi UI                |
| `playwright-test` | menjalankan test                                   |
| `playwright-qa`   | requirement parsing, validation, failures, summary |

### Alur agent secara ringkas

```mermaid
flowchart TD
  A[Requirement valid] --> B[Planner]
  B --> C[Test plan di specs]
  C --> D[Generator]
  D --> E[Spec di src/tests]
  E --> F[Runner]
  F --> G[Summary / reports]
  F --> H[Failures]
  H --> I[Healer]
  I --> F
```

Contoh prompt aman untuk QA:

> Jalankan pipeline lengkap untuk `requirements/login-user.md` sesuai kontrak `AGENTS.md`: validasi requirement, buat test plan, generate test, validate generated tests, run, heal jika gagal, lalu return summary dan unresolved failures.

Detail penuh tetap ada di:

- [docs/GUIDE.md](docs/GUIDE.md)
- [CUSTOM-MCP.md](CUSTOM-MCP.md)
- [AGENTS.md](AGENTS.md)

---

## Peta Dokumentasi: Buka File yang Mana?

| Kalau Anda ingin...                   | Buka ini                                                     |
| ------------------------------------- | ------------------------------------------------------------ |
| setup QA pertama kali                 | [docs/GUIDE.md](docs/GUIDE.md)                               |
| menulis requirement yang valid        | [docs/writing-requirements.md](docs/writing-requirements.md) |
| melihat indeks semua dokumen          | [docs/README.md](docs/README.md)                             |
| fork / adapt repo ini ke project lain | [docs/FORK-ONBOARDING.md](docs/FORK-ONBOARDING.md)           |
| memahami tool MCP dan kontraknya      | [CUSTOM-MCP.md](CUSTOM-MCP.md)                               |
| memahami alur agent resmi             | [AGENTS.md](AGENTS.md)                                       |

---

## Quality Gates dan Verifikasi

### Gate lengkap sebelum push / PR

```bash
npm run test:quality
```

Gate ini mencakup:

- format,
- lint,
- typecheck,
- validate generated tests,
- validate requirement,
- property tests,
- MCP build,
- health check.

### Verifikasi dasar yang harus lulus

```bash
npm run setup:check
npm run health:check
npm run validate:requirement -- requirements/nama-fitur.md
npm test
```

Kalau empat hal ini sehat, biasanya QA sudah punya fondasi yang cukup untuk lanjut ke pipeline AI.

---

## FAQ untuk QA

### Kenapa `requirements/`, bukan `skenario/`?

Karena `requirements/` berisi **input awal**. Satu requirement bisa dipecah menjadi banyak scenario. Scenario hasil AI baru muncul di [specs/](specs/).

### Apa beda `requirements/`, `specs/`, dan `src/tests/`?

- `requirements/` = apa yang ingin diuji
- `specs/` = plan / skenario hasil AI
- `src/tests/` = script Playwright yang bisa dijalankan

### Kalau saya non-code, apa saya wajib edit `.spec.ts`?

Tidak wajib. Flow idealnya: QA fokus menulis requirement dan review hasil, sedangkan agent membantu generate dan heal.

### Kalau test gagal, saya lihat apa dulu?

Urutan aman:

1. [reports/custom-dashboard.html](reports/custom-dashboard.html)
2. `npx playwright show-report`
3. failure flow lewat `get_test_failures` / healer

### Dokumen pertama yang harus dibaca QA apa?

Mulai dari:

- [docs/GUIDE.md](docs/GUIDE.md)

---

---

## Flow Harian QA — Step by Step

Bagian ini menjelaskan secara detail apa yang dilakukan QA setiap hari menggunakan framework ini. Ikuti langkah-langkah ini dari atas ke bawah.

### Fase 1: Persiapan (Sekali di Awal Hari)

```bash
# Pastikan environment sehat
npm run health:check
```

Jika ada error, lihat [Troubleshooting di docs/GUIDE.md](docs/GUIDE.md#troubleshooting-health-check).

### Fase 2: Menulis Requirement

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INPUT: Ide fitur / bug / user story dari PM / BA / ticket             │
│  OUTPUT: File requirements/nama-fitur.md yang valid                     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Langkah:**

1. Salin template:
   ```bash
   copy requirements\_TEMPLATE.md requirements\nama-fitur.md
   ```
2. Isi bagian-bagian wajib:
   - `# REQ-XXX: Judul Fitur` — judul jelas
   - `## Metadata` — tags, prioritas, halaman awal
   - `## Kriteria Penerimaan` — apa yang harus tercapai
   - `## Skenario Uji` — setiap skenario harus punya:
     - `### SC-XX: Nama Skenario`
     - `**Prekondisi:**` kondisi awal
     - `**Langkah:**` aksi user (numbered list)
     - `**Hasil:**` yang bisa diamati (URL, teks, elemen visible)
3. Tandai skenario yang tidak bisa diotomatisasi dengan `(@manual)`:
   ```markdown
   ### SC-03: Verifikasi CAPTCHA (@manual)
   ```

**Tips menulis requirement yang baik:**

- Hasil harus **observable**: "URL berubah ke /dashboard", bukan "sistem bekerja"
- Satu skenario = satu alur user yang jelas
- Boleh pakai Bahasa Indonesia

### Fase 3: Validasi Requirement

```bash
npm run validate:requirement -- requirements/nama-fitur.md
```

**Hasil yang diharapkan:** `✓ All requirement checks passed. Score: 100/100.`

Jika ada error:

| Error                | Perbaikan                                                   |
| -------------------- | ----------------------------------------------------------- |
| `title_required`     | Tambah baris `# REQ-01: Judul Fitur`                        |
| `scenario_structure` | Pastikan setiap `###` punya `**Langkah:**` dan `**Hasil:**` |
| `observable_result`  | Hasil harus menyebut URL/teks/visibility                    |

### Fase 4: Jalankan Pipeline AI

Buka IDE (VS Code/Cursor/Kiro) dengan MCP server aktif, lalu kirim prompt:

```
Jalankan pipeline lengkap untuk requirements/nama-fitur.md sesuai kontrak AGENTS.md:
1. Pre-flight dan validasi requirement
2. Buat test plan di specs/
3. Generate spec Playwright di src/tests/
4. Validasi generated tests
5. Jalankan tests
6. Jika gagal, heal lalu re-run
7. Return summary akhir
```

**Yang terjadi di belakang layar:**

```mermaid
sequenceDiagram
    participant QA as QA (Anda)
    participant AI as AI Agent
    participant PQ as playwright-qa
    participant PT as playwright-test
    participant PW as playwright (browser)

    QA->>AI: "Jalankan pipeline untuk requirements/login.md"
    AI->>PQ: health_check
    PQ-->>AI: ✓ semua sehat
    AI->>PQ: validate_requirement
    PQ-->>AI: ✓ score 100/100
    AI->>PQ: parse_requirement_scenarios
    PQ-->>AI: 3 skenario ditemukan
    Note over AI: Planner membuat test plan
    AI->>PW: browser_snapshot (ambil selector)
    PW-->>AI: DOM snapshot
    Note over AI: Generator menulis .spec.ts
    AI->>PQ: validate_generated_tests
    PQ-->>AI: ✓ valid
    AI->>PT: run_tests
    PT-->>AI: 2 pass, 1 fail
    AI->>PQ: get_test_failures
    PQ-->>AI: detail failure + trace
    Note over AI: Healer memperbaiki
    AI->>PT: run_tests (scoped)
    PT-->>AI: 3 pass, 0 fail
    AI->>PQ: get_test_summary
    PQ-->>AI: summary final
    AI-->>QA: ✓ Pipeline selesai, 3/3 pass
```

### Fase 5: Review Hasil

Setelah pipeline selesai, buka report:

```bash
# Opsi 1: Dashboard custom (lebih ringkas)
start reports/custom-dashboard.html

# Opsi 2: Report Playwright (lebih detail)
npx playwright show-report
```

**Yang perlu dicek:**

- ✅ Berapa test yang pass?
- ⚠️ Berapa yang di-heal? (heal = tadinya gagal, diperbaiki AI)
- ❌ Ada unresolved failure? (perlu investigasi manual)
- 📊 Coverage: semua skenario dari requirement sudah ter-cover?

### Fase 6: Iterasi (jika perlu)

| Kondisi                       | Aksi                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Semua pass                    | ✅ Selesai — push / commit                                                   |
| Ada heal, semua akhirnya pass | ✅ Review perubahan healer, lalu push                                        |
| Ada unresolved failure        | 🔄 Cek: requirement kurang jelas? Selector berubah? Lalu perbaiki dan ulangi |
| Scenario baru muncul          | ➕ Tambah ke requirement, ulangi dari Fase 3                                 |

### Ringkasan Visual Flow Harian

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  TULIS       │     │  VALIDASI    │     │  PIPELINE    │
│  requirement │────▶│  requirement │────▶│  AI          │
│  (.md)       │     │  (CLI)       │     │  (prompt)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                   │
                     ┌──────────────┐     ┌────────▼───────┐
                     │  ITERASI     │     │  REVIEW        │
                     │  (jika perlu)│◀────│  report        │
                     └──────────────┘     └────────────────┘
```

---

## Universal AI Agent Integration Layer

Framework ini mendukung **multi-platform AI client** melalui Integration Layer yang universal. Tidak lagi terikat ke satu AI client saja.

### AI Client yang Didukung

| Platform           | Config File                  | Status            |
| ------------------ | ---------------------------- | ----------------- |
| GitHub Copilot     | `.mcp.json` (source)         | ✅ Native         |
| Claude / Anthropic | `claude_desktop_config.json` | ✅ Auto-generated |
| Cursor             | `.cursor/mcp.json`           | ✅ Auto-generated |
| Kiro               | `.kiro/mcp.json`             | ✅ Auto-generated |
| OpenAI Codex       | via protocol                 | ✅ Supported      |

### Generate Config untuk Platform Anda

```bash
# Generate untuk semua platform sekaligus
npm run mcp:config

# Atau untuk platform tertentu
npm run mcp:config -- --platform claude
npm run mcp:config -- --platform cursor
npm run mcp:config -- --platform kiro
```

### Capability Manifest

AI client bisa self-discover semua kemampuan pipeline melalui manifest:

```bash
npm run manifest:generate
```

Output: `agent-manifest.json` — berisi daftar lengkap phase, tools, input/output schema.

### Validate Agent Instructions

Pastikan semua file agent instruction (.agent.md) valid:

```bash
npm run validate:agents

# Auto-fix masalah yang bisa diperbaiki
npm run validate:agents -- --fix
```

### Mode Orkestrasi

| Mode        | Deskripsi                | Kapan Pakai       |
| ----------- | ------------------------ | ----------------- |
| `manual`    | Satu phase per prompt    | Debug, eksplorasi |
| `automatic` | Full pipeline tanpa jeda | Daily run, CI     |

### Pipeline State dan Resume

Pipeline menyimpan progress otomatis. Jika terputus, bisa dilanjutkan:

- State tersimpan di `reports/pipeline-state.json`
- Resume dari phase terakhir yang berhasil
- History archived di `reports/archive/`

### Event Hooks dan Observability

Setiap transisi phase menghasilkan structured events:

- `phase:start`, `phase:complete`, `phase:error`
- Log tersimpan di `reports/pipeline-events.jsonl`
- Bisa diintegrasikan dengan sistem monitoring eksternal

---

## Penutup

Kalau Anda ingin memakai repo ini dengan benar sebagai QA, ingat 5 langkah utama:

1. Tulis requirement yang jelas.
2. Validasi requirement.
3. Minta agent jalankan pipeline.
4. Review output plan, test, dan report.
5. Ulangi sampai scenario stabil.

Untuk panduan operasional langkah demi langkah, buka [docs/GUIDE.md](docs/GUIDE.md).

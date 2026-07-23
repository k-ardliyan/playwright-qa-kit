# Getting Started — Panduan QA Baru

> **Untuk Anda yang baru pertama kali setup framework ini.** Ikuti langkah-langkah di bawah ini **berurutan**. Estimasi total: 10-15 menit.

---

## 📋 Checklist Pra-Setup (Cek Dulu!)

Jalankan perintah ini di terminal Anda. **Jika ada yang ❌, perbaiki dulu sebelum lanjut.**

```bash
node --version    # Harus >= 20.19.0
git --version     # Harus ada (versi berapa saja)
```

| Prasyarat        | Versi Minimum  | Cara Cek                                                            | Cara Install                      |
| ---------------- | -------------- | ------------------------------------------------------------------- | --------------------------------- |
| Node.js          | **>= 20.19.0** | `node --version`                                                    | <https://nodejs.org/> (pilih LTS) |
| Git              | Apa saja       | `git --version`                                                     | <https://git-scm.com/>            |
| **Hermes Agent** | Latest         | Lihat [panduan install](https://hermes-agent.nousresearch.com/docs) | Sama seperti di atas              |

> **⚠️ Node.js versi lama adalah penyebab #1 setup gagal.** Jika `node --version` menunjukkan v18 atau lebih lama, wizard akan error di Phase 0.

---

## 🚀 Setup dalam 3 Langkah

### Langkah 1 — Clone / Download Repo

**Opsi A: Clone via Git (recommended untuk update di masa depan)**

```bash
git clone https://github.com/<your-org>/playwright-qa-kit.git
cd playwright-qa-kit
```

**Opsi B: Download ZIP (sekali pakai, tanpa Git history)**

1. Buka halaman GitHub repo → klik tombol hijau **Code** → **Download ZIP**
2. Extract ZIP ke folder pilihan Anda
3. Buka terminal di folder tersebut

---

### Langkah 2 — Install Dependencies

```bash
npm install
```

Tunggu sampai selesai (1-3 menit tergantung koneksi internet).

---

### Langkah 3 — Jalankan Setup Wizard

```bash
npm run setup:wizard
```

Wizard akan memandu Anda melalui **7 fase**:

| Fase                         | Apa yang terjadi                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **0. Welcome**               | Cek prasyarat, cek Node.js version                                                                                                         |
| **1. Project + Environment** | Pilih **APP_ENV** dulu (`local`/`dev`/`staging`/…), lalu **BASE_URL untuk env itu** (URL beda per env). File: `environments/{APP_ENV}.env` |
| **2. Kredensial**            | Masukkan akun test ke file env aktif. Nilai dienkripsi otomatis.                                                                           |
| **3. Install**               | Install browser Chromium + build MCP server                                                                                                |
| **4. MCP + Hermes**          | Verifikasi koneksi MCP di Hermes (cek: MCP ● 3 servers)                                                                                    |
| **5. Auth Setup**            | Generate `src/support/auth.setup.ts`, jalankan login test                                                                                  |
| **6. Verify**                | Run `setup:check` + `health:check` + enkripsi `environments/{APP_ENV}.env`                                                                 |
| **7. Pipeline Conductor**    | Generate `requirements/login.md` + cetak prompt Hermes Agent                                                                               |

> **💡 Tip:** Wizard menyimpan progress ke `.wizard-state.json`. Jika terputus di tengah, jalankan ulang dan pilih **"Lanjut dari Phase X"**.

---

## ✅ Verifikasi Setup Berhasil

Setelah wizard selesai, jalankan:

```bash
npm run setup:check
npm run health:check
```

**Target output: semua hijau ✓.** Jika ada warning tentang `json_results.json belum ada` — itu **normal** sebelum test pertama dijalankan.

---

## Setelah Setup — Ganti Kredensial / Ganti Environment

```bash
npm run env:status                 # APP_ENV aktif + source (os|pin|default)
npm run env:use -- staging         # pin environment (local work)
npm run env:edit                   # ganti BASE_URL / password / role / OTP-CAPTCHA di file aktif
npm run auth:setup                 # refresh session
npm run auth:setup:headed          # OTP/CAPTCHA (browser terlihat)
```

**Catatan:** Setiap environment punya file sendiri (`environments/local.env`, `dev.env`, …) dengan **BASE_URL dan kredensial sendiri**. Jangan mengasumsikan URL sama di semua env.

Detail: **[CREDENTIALS.md](CREDENTIALS.md)**.

---

## 🎯 Mulai Testing

Setelah wizard Phase 7 selesai, **framework sudah generate `requirements/login.md`**
untuk **website kamu** (BASE_URL, path login, roles dari wizard) — **bukan** file sample.

| Langkah    | Yang terjadi                                                                   |
| ---------- | ------------------------------------------------------------------------------ |
| **Lihat**  | Buka `requirements/login.md` — requirement REAL project                        |
| **Paste**  | Prompt Phase 7 ke Hermes (wajib `snapshot_page` dulu — locator beda tiap site) |
| **Tunggu** | Plan → Generate → Execute → Heal → Report                                      |
| **Baca**   | [docs/POST-PIPELINE.md](POST-PIPELINE.md) untuk failureSource + keputusan QA   |

**Prompt yang dicetak Phase 7 (inti):**

```
Run full pipeline in automatic mode for requirements/login.md
(orchestrator: AGENTS.md).
BEFORE Plan/Generate: snapshot_page on real BASE_URL+login path;
use selector-catalog locators (Path A, no POM).
```

Atau via CLI:

```bash
npm run qa:run -- requirements/login.md
```

> **ℹ️** `requirements/sample-*.md` = sample format saja. Setup awal = `login.md`.
> **ℹ️** `qa:run` = preflight + prompt helper — pipeline penuh di Hermes.

Hermes akan otomatis:

1. Validasi requirement (cek format)
2. Generate test plan (`specs/login-test-plan.md`)
3. Generate spec Playwright (`src/tests/login*.spec.ts`)
4. Jalankan test
5. Heal jika ada failure
6. Buat laporan di `reports/custom-dashboard.html`

---

## 🆘 Ada Masalah?

- **Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** untuk 10 error paling umum
- **Atau tanya langsung ke Hermes Agent** — dia tahu semua dokumen di repo ini

---

## 📚 Langkah Selanjutnya

| Setelah Setup                   | Baca                                                     |
| ------------------------------- | -------------------------------------------------------- |
| Ganti password / multi-role     | [CREDENTIALS.md](CREDENTIALS.md)                         |
| Ingin tulis requirement pertama | [writing-requirements.md](writing-requirements.md)       |
| Ingin lihat command penting     | [CHEATSHEET.md](CHEATSHEET.md)                           |
| Ingin paham pipeline lengkap    | [GUIDE.md](GUIDE.md)                                     |
| Ingin paham role-based testing  | [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md) |
| Ingin lihat laporan test        | [REPORT-GUIDE.md](REPORT-GUIDE.md)                       |
| Setup dari fork template        | [FORK-ONBOARDING.md](FORK-ONBOARDING.md)                 |

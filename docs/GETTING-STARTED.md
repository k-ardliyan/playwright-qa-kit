# Getting Started — Panduan QA Baru

> **Untuk Anda yang baru pertama kali setup framework ini.** Ikuti langkah-langkah di bawah ini **berurutan**. Estimasi total: 10-15 menit.

---

## 📋 Checklist Pra-Setup (Cek Dulu!)

Jalankan perintah ini di terminal Anda. **Jika ada yang ❌, perbaiki dulu sebelum lanjut.**

```bash
node --version    # Harus >= 20.19.0
git --version     # Harus ada (versi berapa saja)
code --version    # VS Code (opsional tapi disarankan)
```

| Prasyarat        | Versi Minimum  | Cara Cek                | Cara Install                                                        |
| ---------------- | -------------- | ----------------------- | ------------------------------------------------------------------- |
| Node.js          | **>= 20.19.0** | `node --version`        | <https://nodejs.org/> (pilih LTS)                                   |
| Git              | Apa saja       | `git --version`         | <https://git-scm.com/>                                              |
| VS Code          | Latest         | `code --version`        | <https://code.visualstudio.com/>                                    |
| **Hermes Agent** | Latest         | Buka sidebar di VS Code | Lihat [panduan install](https://hermes-agent.nousresearch.com/docs) |

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

| Fase                | Apa yang terjadi                                                      |
| ------------------- | --------------------------------------------------------------------- |
| **0. Welcome**      | Cek prasyarat, cek Node.js version                                    |
| **1. Project Info** | Masukkan URL aplikasi target (misal `https://staging.myapp.com`)      |
| **2. Kredensial**   | Masukkan akun test. Nilai akan dienkripsi otomatis.                   |
| **3. Install**      | Install browser Chromium + build MCP server                           |
| **4. MCP + Hermes** | Verifikasi koneksi MCP di VS Code (cek status bar: `MCP ● 3 servers`) |
| **5. Auth Setup**   | Generate `src/support/auth.setup.ts`, jalankan login test             |
| **6. Verify**       | Run `setup:check` + `health:check` + enkripsi `local.env`             |
| **7. Next Steps**   | Prompt siap pakai untuk Hermes Agent                                  |

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

## 🎯 Mulai Testing

```bash
# Salin template requirement
cp requirements/_TEMPLATE.md requirements/fitur-login.md

# Edit file: isi judul, tags, prioritas, dan skenario
# Lalu buka VS Code dan minta Hermes Agent:
```

**Kirim prompt ini ke Hermes Agent di VS Code:**

```
Jalankan pipeline QA untuk requirements/fitur-login.md
```

Hermes akan otomatis:

1. Validasi requirement (cek format)
2. Generate test plan (`specs/fitur-login-test-plan.md`)
3. Generate spec Playwright (`src/tests/fitur-login.spec.ts`)
4. Jalankan test
5. Heal jika ada failure
6. Buat laporan di `reports/custom-dashboard.html`

---

## 🆘 Ada Masalah?

- **Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** untuk 10 error paling umum
- **Atau tanya langsung ke Hermes Agent** di VS Code — dia tahu semua dokumen di repo ini

---

## 📚 Langkah Selanjutnya

| Setelah Setup                   | Baca                                                     |
| ------------------------------- | -------------------------------------------------------- |
| Ingin tulis requirement pertama | [writing-requirements.md](writing-requirements.md)       |
| Ingin lihat command penting     | [CHEATSHEET.md](CHEATSHEET.md)                           |
| Ingin paham pipeline lengkap    | [GUIDE.md](GUIDE.md)                                     |
| Ingin paham role-based testing  | [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md) |
| Ingin lihat laporan test        | [REPORT-GUIDE.md](REPORT-GUIDE.md)                       |
| Setup dari fork template        | [FORK-ONBOARDING.md](FORK-ONBOARDING.md)                 |

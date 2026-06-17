# Panduan Instalasi Playwright QA Kit (Windows)

Panduan ini untuk tim QA yang setup laptop Windows dari nol sampai siap jalankan tes dan pipeline Codex. Target repo: [github.com/k-ardliyan/playwright-qa-kit](https://github.com/k-ardliyan/playwright-qa-kit), branch `main`.

Kalau sudah pernah setup dan cuma mau cek ulang, loncat ke [Verifikasi akhir](#verifikasi-akhir). Untuk alur harian setelah instalasi, lihat [GUIDE.md](GUIDE.md). Untuk checklist hari workshop, lihat [WORKSHOP.md](WORKSHOP.md).

---

## Spesifikasi minimum

| Item       | Rekomendasi                                                                |
| ---------- | -------------------------------------------------------------------------- |
| OS         | Windows 10 atau 11 (64-bit)                                                |
| RAM        | 8 GB (16 GB lebih nyaman saat browser + VS Code jalan bersamaan)           |
| Ruang disk | ~2 GB kosong (Node modules + browser Chromium Playwright)                  |
| Internet   | Waktu install pertama (npm, download browser)                              |
| Akun       | ChatGPT Plus/Pro/Team/Enterprise untuk ekstensi Codex, atau API key OpenAI |

Node.js versi 22.x LTS disarankan. Framework ini butuh minimal Node **20.19.0**. Versi di bawah itu sering bikin `npm install` atau Playwright error tanpa pesan yang jelas.

---

## Daftar software

Instal urutannya seperti di bawah. Git opsional kalau mau pakai download ZIP saja.

| Urutan | Software                | Unduh                                                                                               |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| 1      | Node.js 22.x LTS        | https://nodejs.org/                                                                                 |
| 2      | Visual Studio Code      | https://code.visualstudio.com/                                                                      |
| 3      | Ekstensi Codex (OpenAI) | Install dari dalam VS Code, atau https://marketplace.visualstudio.com/items?itemName=openai.chatgpt |
| 4      | Git _(opsional)_        | https://git-scm.com/download/win                                                                    |

---

## Langkah 1: Install Node.js 22

1. Buka https://nodejs.org/
2. Klik tombol download untuk **22.x LTS** (bukan Current kalau Anda ingin versi stabil).
3. Jalankan file `.msi` yang terunduh.
4. Di wizard installer, biarkan opsi default. Pastikan **"Add to PATH"** tercentang (biasanya default).
5. Opsi **"Automatically install the necessary tools"** boleh dicentang; Windows mungkin minta restart lagi nanti.
6. Setelah selesai, tutup semua jendela PowerShell atau terminal yang sudah terbuka, lalu buka yang baru.

Verifikasi:

```powershell
node -v
npm -v
```

Output yang benar kira-kira `v22.x.x` dan `10.x.x` untuk npm.

**Kalau muncul "node is not recognized":**

- Restart laptop sekali (PATH kadang baru kebaca setelah reboot).
- Install ulang Node.js, pastikan tidak ada centang yang dilewati di bagian PATH.
- Cek di PowerShell: `$env:Path -split ';' | Select-String node`

---

## Langkah 2: Install VS Code

1. Unduh dari https://code.visualstudio.com/ (User Installer untuk Windows).
2. Install dengan setting default.
3. Saat pertama buka, Anda boleh skip theme/login Microsoft.

Nanti project dibuka lewat **File → Open Folder**, bukan buka file `.ts` satu per satu. Codex dan MCP butuh root folder repo terbuka supaya path `.vscode/mcp.json` kebaca.

---

## Langkah 3: Ambil source code dari GitHub

Pilih salah satu cara.

### Opsi A: Download ZIP (tanpa Git)

Cocok kalau belum punya Git atau tidak perlu `git pull` rutin.

1. Buka https://github.com/k-ardliyan/playwright-qa-kit
2. Tombol hijau **Code** → **Download ZIP**
3. Ekstrak ke folder yang path-nya pendek dan tanpa spasi, misalnya:
   - `C:\Projects\playwright-qa-kit-main`
4. Buka folder hasil ekstrak di VS Code: **File → Open Folder**

Perhatikan nama folder setelah ekstrak biasanya `playwright-qa-kit-main`, bukan `playwright-qa-kit`. Itu normal.

Pastikan di dalam folder ada file-file ini:

- `package.json`
- `playwright.config.ts`
- folder `.vscode` (berisi `mcp.json`)
- folder `environments`
- folder `requirements`

Kalau `.vscode` tidak kelihatan di Explorer Windows, aktifkan **View → Show hidden files** atau cek langsung lewat VS Code sidebar.

### Opsi B: Git clone

Cocok kalau sudah terbiasa dengan Git dan mau update repo dengan `git pull`.

```powershell
cd C:\Projects
git clone https://github.com/k-ardliyan/playwright-qa-kit.git
cd playwright-qa-kit
code .
```

Perintah `code .` membuka folder saat ini di VS Code (butuh VS Code sudah ada di PATH; opsi ini bisa dicentang saat install VS Code).

---

## Langkah 4: Install ekstensi Codex

Codex dipakai sebagai agent AI di dalam VS Code. Framework ini mengandalkan tiga MCP server yang sudah dikonfigurasi di repo; Codex yang menjalankannya.

1. Di VS Code, buka Extensions: `Ctrl+Shift+X`
2. Cari **Codex**, publisher **OpenAI**
3. Klik **Install**
4. Ikon Codex muncul di sidebar (sering di kanan). Klik, lalu **Sign in with ChatGPT**
5. Browser terbuka untuk login. Pakai akun dengan plan Plus, Pro, Team, atau Enterprise.

Alternatif login: API key OpenAI lewat pengaturan Codex. Detail ada di https://developers.openai.com/codex/auth

**Ekstensi tambahan (opsional):**

- **Playwright Test for VSCode** — run tes dari sidebar tanpa ketik perintah
- **Prettier** / **ESLint** — membantu baca error format di file TypeScript

Tanpa ekstensi tambahan pun instalasi tetap jalan; yang wajib untuk workshop pipeline AI hanya Codex.

---

## Langkah 5: Install dependensi project

Buka terminal di VS Code: **Terminal → New Terminal**. Pastikan prompt menunjukkan path ke root project (ada `package.json` di folder yang sama).

Jalankan perintah berikut **satu per satu**. Tunggu masing-masing selesai sebelum lanjut.

### 5.1 npm install

```powershell
npm install
```

Mengunduh semua package Node yang dibutuhkan framework, Playwright, dan MCP server. Pertama kali bisa 2–5 menit tergantung koneksi.

Kalau gagal dengan error permission atau EPERM, tutup VS Code, buka PowerShell biasa (bukan Run as Administrator kecuali memang dibutuhkan), `cd` ke folder project, ulangi `npm install`.

### 5.2 Install browser Chromium

```powershell
npx playwright install --with-deps chromium
```

Mengunduh Chromium khusus Playwright plus dependency sistem Windows untuk headless/headed test. Butuh ~300–500 MB.

Kalau perusahaan pakai proxy atau antivirus agresif, unduhan ini kadang terblokir. Whitelist folder project atau jalankan ulang dari jaringan yang tidak dibatasi.

### 5.3 Build MCP server custom

```powershell
npm run mcp:build
```

Perintah ini wajib. Tanpa build, server `playwright-qa` di Codex tidak punya file `mcp-server/dist/index-mcp.js` dan status MCP akan merah.

Isi perintah: install dependency di subfolder `mcp-server`, lalu compile TypeScript ke JavaScript.

Ulangi `npm run mcp:build` setiap kali:

- Baru clone/pull repo
- Ada perubahan di folder `mcp-server/`
- MCP `playwright-qa` error "file not found"

---

## Langkah 6: Buat file environment

Framework membaca konfigurasi dari `environments/{APP_ENV}.env`. Default-nya `APP_ENV=local`, jadi file yang dipakai: `environments/local.env`.

### 6.1 Salin template

Di PowerShell (dari root project):

```powershell
copy environments\local.env.example environments\local.env
```

Atau manual: duplikat `local.env.example`, rename jadi `local.env`.

### 6.2 Isi nilai yang relevan

Buka `environments/local.env` dengan VS Code atau Notepad. Contoh untuk workshop (QA tes app di laptop FE lain via LAN):

```env
BASE_URL=http://192.168.1.50:5173/
APP_ENV=local
ENV_NAME=workshop-pod-2
PLAYWRIGHT_CONFIG=playwright.config.ts
TEST_USER_EMAIL=qa@contoh.com
TEST_USER_USERNAME=qauser
TEST_USER_PASSWORD=ganti_dengan_password_asli
HEADLESS=true
SLOW_MO=0
```

Contoh untuk development lokal (app jalan di laptop yang sama):

```env
BASE_URL=http://localhost:3000/
APP_ENV=local
ENV_NAME=local-dev
PLAYWRIGHT_CONFIG=playwright.config.ts
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your_password_here
```

Penjelasan field:

| Variable                                    | Fungsi                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `BASE_URL`                                  | URL aplikasi yang diuji. Workshop: IP laptop FE + port, **bukan** `localhost` di laptop QA. |
| `APP_ENV`                                   | Menentukan file env mana yang diload (`local`, `dev`, `staging`, dll.)                      |
| `ENV_NAME`                                  | Label untuk logging; bebas, misalnya nama pod workshop                                      |
| `PLAYWRIGHT_CONFIG`                         | Path config Playwright. Default `playwright.config.ts` (Path A / template core)             |
| `TEST_USER_EMAIL` / `USERNAME` / `PASSWORD` | Kredensial akun QA untuk skenario login                                                     |
| `HEADLESS`                                  | `true` = browser tidak tampil; `false` = browser kelihatan                                  |
| `SLOW_MO`                                   | Delay ms per aksi browser; `0` normal, angka positif untuk demo lambat                      |

File `local.env` berisi password. Jangan commit ke Git, jangan kirim ke grup chat publik.

### 6.3 Adapter ERPKU (hanya kalau dipakai)

Kalau facilitator minta demo suite ERPKU (`example/erpku/`), tambahkan field dari `example/erpku/environments/erpku.env.example` ke `local.env`, lalu set:

```env
PLAYWRIGHT_CONFIG=example/erpku/playwright.config.ts
```

Untuk latihan pipeline AI workshop standar, biarkan `PLAYWRIGHT_CONFIG=playwright.config.ts`.

---

## Langkah 7: Aktifkan dan cek MCP server

File `.vscode/mcp.json` sudah ada di repo. Isinya tiga server:

| Server            | Peran                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `playwright`      | Navigasi dan inspeksi UI (`browser_navigate`, `browser_snapshot`, dll.) |
| `playwright-test` | Menjalankan tes Playwright (`run_tests`)                                |
| `playwright-qa`   | Validasi requirement, baca kegagalan, ringkasan laporan                 |

### Cara cek di VS Code + Codex

1. Setelah `local.env` disimpan, reload window: `Ctrl+Shift+P` → ketik **Developer: Reload Window** → Enter
2. Buka panel Codex atau pengaturan MCP di VS Code
3. Ketiga server di atas harus status connected (hijau)

Kalau ada yang merah:

```powershell
npm run mcp:build
```

Lalu reload window lagi. Kalau masih merah, cek output terminal saat MCP start (sering karena Node tidak ketemu atau path project salah).

Setiap kali mengubah `PLAYWRIGHT_CONFIG`, `BASE_URL`, atau kredensial di `local.env`, restart MCP / reload VS Code supaya server baca nilai baru.

---

## Langkah 8: Verifikasi instalasi

### 8.1 setup:check

```powershell
npm run setup:check
```

Memastikan file penting ada: `mcp.json`, build MCP, template requirement, `AGENTS.md`, dll. Tidak ada baris `ERROR` di output.

### 8.2 health:check

```powershell
npm run health:check
```

Pre-flight lebih lengkap: versi Node, build MCP, file environment, `BASE_URL`, dll.

| Check          | Arti jika fail/warn                                        |
| -------------- | ---------------------------------------------------------- |
| `node`         | Node belum terinstall atau versi terlalu lama              |
| `mcp_build`    | Jalankan `npm run mcp:build`                               |
| `environment`  | Buat `environments/local.env` dari template                |
| `base_url`     | Isi `BASE_URL` di `local.env`                              |
| `json_results` | Warn normal sebelum tes pertama; hilang setelah `npm test` |

### 8.3 Jalankan tes seed

```powershell
npm test
```

Menjalankan tes template core (bukan demo Healer). Harus lulus tanpa fail.

Pertama kali mungkin agak lama karena Playwright menyiapkan browser profile.

### 8.4 Buka laporan

Setelah `npm test` selesai:

- Dashboard kustom: buka `reports/custom-dashboard.html` di Chrome/Edge
- Laporan Playwright bawaan: `npx playwright show-report`

---

## Verifikasi akhir

Centang manual sebelum anggap setup selesai:

- [ ] `node -v` menampilkan v22.x (atau minimal v20.19)
- [ ] Folder project terbuka di VS Code (root, bukan subfolder)
- [ ] Codex terinstall dan sudah login
- [ ] `npm install`, `playwright install`, `mcp:build` sukses tanpa error
- [ ] `environments/local.env` ada dan `BASE_URL` + kredensial terisi
- [ ] Tiga MCP server connected setelah reload window
- [ ] `npm run health:check` tanpa status fail
- [ ] `npm test` pass
- [ ] Browser manual bisa buka URL yang sama dengan `BASE_URL` dari laptop QA

---

## Latihan pertama dengan Codex

Setelah checklist di atas lulus:

1. Buka `requirements/example-login-extension.md` di VS Code
2. Buka `docs/prompt-ai-agent.md`, salin bagian **Pipeline lengkap**
3. Di chat Codex, ganti path requirement jika perlu, lalu kirim prompt

Output yang diharapkan dari pipeline:

- `specs/example-login-extension-test-plan.md` (Planner)
- `src/tests/*.spec.ts` (Generator)
- Tes jalan; dashboard terupdate di `reports/custom-dashboard.html`

Kalau mau validasi format requirement dulu tanpa generate kode:

```powershell
npm run validate:requirement -- requirements/example-login-extension.md
```

---

## Ringkasan perintah (urutan install)

```powershell
# Dari root project, setelah Node + VS Code + folder repo siap:
npm install
npx playwright install --with-deps chromium
npm run mcp:build
copy environments\local.env.example environments\local.env
# edit environments\local.env — isi BASE_URL dan kredensial
# reload VS Code, cek 3 MCP hijau
npm run setup:check
npm run health:check
npm test
```

---

## Troubleshooting

### Node dan npm

| Gejala                          | Tindakan                                                         |
| ------------------------------- | ---------------------------------------------------------------- |
| `node` tidak dikenali           | Restart PC; install ulang Node 22 dengan Add to PATH             |
| Versi Node terlalu lama         | Upgrade ke 22.x dari nodejs.org                                  |
| `npm install` hang atau timeout | Coba jaringan lain; `npm cache clean --force` lalu install ulang |

### PowerShell

Kalau script npm error soal execution policy:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Jalankan sekali, lalu ulangi perintah npm.

### MCP merah di Codex

1. `npm run mcp:build` dari root project
2. Pastikan tidak ada typo di `local.env`
3. Reload Window (`Ctrl+Shift+P`)
4. Buka project sebagai folder root, bukan file tunggal

### health_check gagal

Lihat tabel di [Langkah 8.2](#82-healthcheck). Panduan lengkap: [GUIDE.md — Troubleshooting health_check](GUIDE.md#troubleshooting-health-check)

### Tes gagal karena app tidak reachable

- Cek `BASE_URL` di browser manual dari laptop QA
- Workshop LAN: pastikan laptop QA dan FE satu WiFi; FE listen `0.0.0.0`; firewall allow port FE
- Detail jaringan: [WORKSHOP.md — Topologi LAN](WORKSHOP.md#topologi-lan)

### Browser Playwright error

```powershell
npx playwright install --with-deps chromium
```

Kalau masih gagal, jalankan PowerShell sebagai administrator sekali untuk install system deps.

---

## Dokumen terkait

| Dokumen                                          | Isi                                       |
| ------------------------------------------------ | ----------------------------------------- |
| [GUIDE.md](GUIDE.md)                             | Alur harian QA, pipeline, troubleshooting |
| [WORKSHOP.md](WORKSHOP.md)                       | Go/No-Go hari-H, topologi LAN             |
| [WORKSHOP-CHEATSHEET.md](WORKSHOP-CHEATSHEET.md) | Ringkasan satu halaman untuk print        |
| [prompt-ai-agent.md](prompt-ai-agent.md)         | Prompt copy-paste untuk Codex             |
| [CUSTOM-MCP.md](../CUSTOM-MCP.md)                | Daftar tool MCP (referensi teknis)        |

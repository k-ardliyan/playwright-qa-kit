# 🚀 ERPku E2E Testing Suite — Next.js & JavaScript Migration Guide

Dokumen ini memandu Anda memindahkan dan mengintegrasikan repositori testing Playwright + TypeScript standalone ini ke dalam **repositori frontend utama ERPku yang menggunakan Next.js + JavaScript (JS)**.

Meskipun frontend utama Anda berbasis JavaScript, **sangat disarankan untuk tetap mempertahankan E2E tests dalam TypeScript** demi mendapatkan autocomplete penuh dan type safety tanpa mengganggu codebase Next.js JS Anda.

---

## 📌 Skenario Integrasi

Pilih salah satu dari 2 skenario integrasi berikut yang sesuai dengan struktur folder repositori frontend Next.js Anda:

### Skenario A: Folder Mandiri (`/e2e` - Direkomendasikan)
Gunakan skenario ini jika repositori frontend utama Next.js Anda berupa single project (bukan monorepo).

1. **Salin Folder & Berkas Utama**:
   Salin folder dan berkas berikut dari repositori ini ke dalam folder root repositori frontend Next.js Anda:
   * Folder `tests/` $\rightarrow$ masukkan ke folder `/e2e` di root.
   * Berkas `tsconfig.json` $\rightarrow$ pindahkan ke dalam folder `/e2e/tsconfig.json` (ini akan mengisolasi TypeScript E2E dari Next.js JS Anda).
   * Berkas `.env.example` $\rightarrow$ gabungkan isinya ke `.env.example` frontend Anda.
   * Berkas `.github/workflows/playwright.yml` $\rightarrow$ salin ke folder `.github/workflows/` frontend.

2. **Gabungkan Dependencies (`package.json`)**:
   Tambahkan devDependencies dan scripts berikut ke dalam `package.json` utama Next.js frontend Anda:
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:smoke": "playwright test --grep @smoke"
     },
     "devDependencies": {
       "@playwright/test": "^1.52.0",
       "eslint-plugin-playwright": "^2.2.0"
     }
   }
   ```

3. **Gunakan Konfigurasi Playwright**:
   Salin `playwright.config.monorepo.ts` dari repositori ini ke root Next.js Anda, lalu ubah namanya menjadi **`playwright.config.ts`**. Konfigurasi ini sudah dioptimalkan khusus untuk port default Next.js (3000) dan pengisian `webServer` otomatis.

---

### Skenario B: Monorepo Package (`/packages/e2e-tests`)
Gunakan skenario ini jika repositori frontend utama Next.js Anda menggunakan workspaces (Yarn/PNPM/NPM Workspaces).

1. **Buat Folder Package Baru**:
   Buat subfolder `/packages/e2e-tests` (atau `/apps/e2e-tests`) di repositori frontend Anda.

2. **Salin Seluruh Berkas**:
   Salin seluruh berkas dari repositori standalone ini (termasuk `package.json`, `tsconfig.json`, `playwright.config.ts`, dan folder `tests/`) langsung ke dalam subfolder baru tersebut.

3. **Daftarkan Workspace**:
   Pastikan folder packages baru terdaftar pada berkas monorepo root Anda:
   * **PNPM (`pnpm-workspace.yaml`)**:
     ```yaml
     packages:
       - 'packages/*'
     ```
   * **Yarn/NPM (`package.json` root)**:
     ```json
     "workspaces": [
       "packages/*"
     ]
     ```

4. **Aktifkan WebServer Otomatis**:
   Gunakan konfigurasi `playwright.config.monorepo.ts` sebagai acuan setup di subfolder monorepo Anda.

---

## 🛠️ Konfigurasi WebServer Otomatis (Next.js)

Setelah merger, Playwright dapat menyalakan server Next.js lokal secara otomatis sebelum testing berjalan:

Di dalam berkas `playwright.config.ts` Anda, pastikan blok `webServer` terkonfigurasi sebagai berikut:
```typescript
  webServer: {
    // Di lokal: jalankan server dev biasa (cepat).
    // Di CI (GitHub Actions): build dahulu lalu start (menguji real production build Next.js).
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000', // Port default Next.js
    reuseExistingServer: !process.env.CI, // Gunakan server lokal jika sudah menyala (tidak perlu restart di lokal)
    timeout: 120_000,
  }
```

---

## 🔒 Manajemen Secrets di CI (GitHub Actions)

Setelah merger, pastikan Anda menambahkan repository secrets berikut di halaman GitHub Settings repositori utama Anda:
* `BASE_URL`: URL utama aplikasi web target.
* `TEST_USER_EMAIL`: Email credential uji QA.
* `TEST_USER_PASSWORD`: Password credential uji QA.

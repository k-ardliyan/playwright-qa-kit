# 🚀 Playwright QA Kit — Migration & Integration Guide

Dokumen ini memandu integrasi framework Playwright + TypeScript ini ke repositori frontend Anda (Next.js, monorepo, atau single repo).

Walau frontend utama berbasis JavaScript, disarankan tetap menjalankan E2E dalam TypeScript untuk autocomplete dan type safety.

---

## 📌 Skenario Integrasi

Pilih salah satu pendekatan berikut sesuai struktur repositori target.

### Skenario A: Folder Mandiri (`/e2e`) — Direkomendasikan

Gunakan jika repositori frontend Anda single project.

1. **Salin Folder & Berkas Utama**
   - Salin folder pengujian ke `/e2e` di root.
   - Salin `tsconfig.json` menjadi `/e2e/tsconfig.json` untuk isolasi konfigurasi TypeScript E2E.
   - Gabungkan isi `.env.example` ke `.env.example` repositori target.
   - Salin workflow Playwright ke `.github/workflows/` jika CI digunakan.

2. **Gabungkan Dependency & Script**
   Tambahkan script E2E dan dependency Playwright ke `package.json` repositori target.

3. **Gunakan Konfigurasi Playwright**
   Salin `playwright.config.base.ts` (kebijakan eksekusi bersama) dan gunakan [`docs/recipes/playwright.config.nextjs-e2e.recipe.ts`](docs/recipes/playwright.config.nextjs-e2e.recipe.ts) sebagai acuan untuk `playwright.config.ts` di repositori target — spread `playwrightSharedDefaults`, lalu override `testDir`, `projects`, dan `reporter` sesuai struktur `/e2e` Anda.

---

### Skenario B: Monorepo Package (`/packages/e2e-tests`)

Gunakan jika repositori target memakai workspaces (PNPM/Yarn/NPM Workspaces).

1. Buat subfolder package baru, misalnya `/packages/e2e-tests`.
2. Salin file framework (`package.json`, `tsconfig.json`, `playwright.config.ts`, `src/`, dan dokumen pendukung) ke subfolder tersebut.
3. Daftarkan package pada konfigurasi workspace root.
4. Jalankan instalasi dependency dari root monorepo.

---

## 🛠️ Konfigurasi WebServer Otomatis (Next.js)

Jika aplikasi target memakai Next.js, gunakan pola `webServer` berikut agar server menyala otomatis sebelum test berjalan:

```typescript
webServer: {
  command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}
```

Sesuaikan `url` jika aplikasi target tidak berjalan di port `3000`.

---

## 🔒 Manajemen Secrets di CI

Tambahkan secret minimum di provider CI Anda:

- `BASE_URL`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Tambahkan secret lain sesuai kebutuhan domain aplikasi Anda.

---

## ✅ Checklist Setelah Migrasi

1. `npm run setup:check`
2. `npm run lint`
3. `npm run typecheck`
4. `npx playwright test --grep @smoke`

Jika seluruh langkah lolos, integrasi dasar framework sudah siap dipakai di project target.

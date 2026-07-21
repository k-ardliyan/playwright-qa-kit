# Auth Context Convention

Dokumen ini mendefinisikan konvensi penyimpanan auth state per role untuk framework Playwright QA ini.

> **Kelola kredensial (password, tambah/hapus role, encrypt):** lihat **[CREDENTIALS.md](CREDENTIALS.md)** — `npm run env:edit`.
>
> **Path auth setup (template core):** `src/support/auth.setup.ts` (di-generate `setup:wizard` / menu env:edit).  
> Adapter ERPKU sample: `example/erpku/support/auth.setup.ts`.

---

## Struktur Direktori

Semua auth state file disimpan di direktori `.auth/` di root repo:

```
.auth/
  user.json          ← authenticated user biasa (default)
  super-admin.json   ← super admin
  finance.json       ← finance role
  hrd.json           ← hrd role
  admin.json         ← admin role
```

File-file ini berisi Playwright storage state (cookies + localStorage) yang dibuat oleh auth setup test.

> `.auth/` sudah ada di `.gitignore` — jangan commit auth state ke repository.

---

## Naming Convention

| Role bisnis   | Storage state path       | Keterangan                     |
| ------------- | ------------------------ | ------------------------------ |
| `user`        | `.auth/user.json`        | Default authenticated user     |
| `super-admin` | `.auth/super-admin.json` | Super admin dengan akses penuh |
| `finance`     | `.auth/finance.json`     | Finance role                   |
| `hrd`         | `.auth/hrd.json`         | HRD role                       |
| `admin`       | `.auth/admin.json`       | Admin role                     |

Untuk role baru: gunakan nama role lowercase dengan hyphen, simpan di `.auth/<role>.json`.

---

## Cara Membuat Auth Setup Test

**Disarankan:** generate lewat `npm run setup:wizard` (Phase 5) atau `npm run env:edit` → _Regenerasi auth.setup.ts_.  
File default: **`src/support/auth.setup.ts`**.

Jalankan:

```bash
npx playwright test src/support/auth.setup.ts --project=setup
```

Contoh manual (multi-role) di `src/support/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test';

// Setup untuk role finance
setup('authenticate:finance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.FINANCE_EMAIL!);
  await page.getByLabel('Password').fill(process.env.FINANCE_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');

  // Simpan storage state ke .auth/finance.json
  await page.context().storageState({ path: '.auth/finance.json' });
});

// Setup untuk role super-admin
setup('authenticate:super-admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.SUPER_ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.SUPER_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');

  await page.context().storageState({ path: '.auth/super-admin.json' });
});
```

---

## Cara Pakai di Test File

### General (satu role)

```typescript
import { test } from '@/fixtures/base.fixture';

test.use({ storageState: '.auth/finance.json' });

test.describe('Finance — Approve Invoice', { tag: ['@finance', '@regression'] }, () => {
  test('SC-01: Finance dapat approve invoice (@success)', async ({ page }) => {
    // ...
  });
});
```

### Role-Aware (satu file per role)

Buat file terpisah per role:

**`src/tests/invoice-finance.spec.ts`**

```typescript
import { test } from '@/fixtures/base.fixture';

test.use({ storageState: '.auth/finance.json' });

test.describe('Invoice — Finance Role', { tag: ['@finance', '@role-finance'] }, () => {
  // scenario untuk finance
});
```

**`src/tests/invoice-super-admin.spec.ts`**

```typescript
import { test } from '@/fixtures/base.fixture';

test.use({ storageState: '.auth/super-admin.json' });

test.describe('Invoice — Super Admin Role', { tag: ['@super-admin', '@role-super-admin'] }, () => {
  // scenario untuk super-admin
});
```

**`src/tests/invoice-hrd.spec.ts`** (access restriction)

```typescript
import { test } from '@/fixtures/base.fixture';

test.use({ storageState: '.auth/hrd.json' });

test.describe('Invoice — HRD Role (Access Restriction)', { tag: ['@hrd', '@role-hrd'] }, () => {
  test('SC-03: HRD tidak dapat mengakses halaman finance (@access-restriction)', async ({
    page,
  }) => {
    await page.goto('/finance/invoices');
    // Assert: redirect ke halaman lain atau pesan akses ditolak
    await expect(page).not.toHaveURL('/finance/invoices');
  });
});
```

---

## Konfigurasi `playwright.config.ts` untuk Multi-Role Setup

Tambahkan setup project di `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    // Auth setup projects — jalankan dulu sebelum test
    {
      name: 'setup-finance',
      testMatch: '**/auth.setup.ts',
      grep: /authenticate as finance/,
    },
    {
      name: 'setup-super-admin',
      testMatch: '**/auth.setup.ts',
      grep: /authenticate as super-admin/,
    },

    // Test projects — depends on setup
    {
      name: 'finance-tests',
      testMatch: '**/*-finance.spec.ts',
      dependencies: ['setup-finance'],
    },
    {
      name: 'super-admin-tests',
      testMatch: '**/*-super-admin.spec.ts',
      dependencies: ['setup-super-admin'],
    },
    {
      name: 'general-tests',
      testMatch: '**/!(*.role).spec.ts',
      // No auth dependency — uses default or unauthenticated
    },
  ],
});
```

---

## Environment Variables

Simpan kredensial di `environments/local.env` (jangan commit). Naming framework:

```env
# Default user (wajib untuk single-role)
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=password123

# Super Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=adminpassword

# Finance
FINANCE_EMAIL=finance@example.com
FINANCE_PASSWORD=financepassword

# HRD
HRD_EMAIL=hrd@example.com
HRD_PASSWORD=hrdpassword
```

Edit aman setelah encrypt: `npm run env:edit` — lihat [CREDENTIALS.md](CREDENTIALS.md).

---

## Generator Auth Context Mapping

Generator membaca kolom `Auth Context` dari test plan dan memetakannya ke kode:

| Auth Context value       | Generated `test.use()`                                     |
| ------------------------ | ---------------------------------------------------------- |
| `unauthenticated`        | `test.use({ storageState: { cookies: [], origins: [] } })` |
| `.auth/finance.json`     | `test.use({ storageState: '.auth/finance.json' })`         |
| `.auth/super-admin.json` | `test.use({ storageState: '.auth/super-admin.json' })`     |
| `.auth/hrd.json`         | `test.use({ storageState: '.auth/hrd.json' })`             |
| `.auth/user.json`        | `test.use({ storageState: '.auth/user.json' })`            |

Jika file `.auth/<role>.json` belum ada, Generator akan menambahkan komentar:

```typescript
// AUTH SETUP REQUIRED: run auth setup for role '<role>' first
// Create .auth/<role>.json by running: npx playwright test auth.setup.ts --grep "authenticate as <role>"
```

---

## Checklist Sebelum Jalankan Role-Aware Test

- [ ] `environments/local.env` sudah diisi kredensial per role (`TEST_USER_*` / `{ROLE}_*`)
- [ ] Auth setup ada di `src/support/auth.setup.ts` (wizard / env:edit)
- [ ] File `.auth/<role>.json` sudah dibuat: `npx playwright test src/support/auth.setup.ts --project=setup`
- [ ] Project `setup` ada di `playwright.config.ts` (template core sudah include)
- [ ] Test file menggunakan `test.use({ storageState: '.auth/<role>.json' })` di level describe

# Playwright E2E Separate Repository — Execution Plan (Reviewed)

## Overview

Breakdown dari [plan.md](file:///c:/laragon/www/erpku-testing/erpku-automation-nodejs/plan.md) menjadi 6 phase yang implementable. **Phase 1 di-detail-kan secara penuh**, phase selanjutnya outline — menunggu approval per phase.

Arsitektur dan konvensi di-derivasi dari Python repo yang sudah ada ([erpku-automation-python](file:///c:/laragon/www/erpku-testing/erpku-automation-python)), diterjemahkan ke idiom TypeScript + Playwright Test Runner.

### Keputusan dari Review

| # | Keputusan | Detail |
|---|-----------|--------|
| Q1 | **Satu file `.env`** | Cukup `.env` saja (default dev), tidak perlu per-environment. Switching env cukup ganti value. |
| Q2 | **`plan.md` dihapus** | Setelah Phase 1 ter-implement, `plan.md` akan dihapus karena planning baru sudah ada di sini. |
| Q3 | **Smoke test cek element spesifik** | Smoke test akan verify login form (input email, input password, tombol Login) — sesuai pola Python repo [LoginPage](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/login_page.py). |
| Q4 | **Path aliases di Phase 1** | `@pages/*`, `@fixtures/*`, `@utils/*`, `@data/*` ditambahkan sekarang di `tsconfig.json`. |

---

## Phase Overview

| Phase | Nama | Deliverable Inti | Status |
|-------|------|-----------------|--------|
| 1 | Bootstrap Repository | Skeleton project, config, 1 smoke test | ✅ Done |
| 2 | Core Project Standards | ESLint, npm scripts, typecheck gate | ✅ Done |
| 3 | Base Test Framework | BasePage, env utility, fixtures, auth setup | ✅ Done |
| 4 | First Real User Flows | Login, logout, dashboard, smoke path | ✅ Done |
| 5 | CI Integration | GitHub Actions, report upload, secrets | ✅ Done |
| 6 | Merge-Ready Preparation | Portability check, monorepo config example | 📋 Ready |

---

## Phase 1 — Bootstrap Repository

### Goal

Buat project Playwright + TypeScript standalone yang bisa `npm install`, install browser, dan jalankan 1 smoke test (dengan element check spesifik ERPku) terhadap `BASE_URL` dari environment variable.

> [!IMPORTANT]
> Phase 1 sengaja **TIDAK** include ESLint, POM class, fixture extension, atau helper utils. Semua itu masuk Phase 2-3. Focus: "project bisa jalan dari nol + validate landing page elements".

### 1.1 File yang Harus Dibuat

```
erpku-automation-nodejs/
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── tests/
│   ├── specs/
│   │   └── smoke/
│   │       └── smoke.spec.ts
│   ├── pages/
│   │   └── .gitkeep
│   ├── fixtures/
│   │   └── .gitkeep
│   ├── utils/
│   │   └── .gitkeep
│   ├── data/
│   │   └── .gitkeep
│   └── support/
│       └── .gitkeep
└── reports/
    └── .gitkeep
```

**Total: 13 files** (termasuk `.gitkeep` untuk preserve folder structure di Git).

**File yang dihapus**: `plan.md` (setelah implementation selesai).

---

### 1.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `package.json`

**Alasan**: Entry point project. Minimal scripts untuk Phase 1, akan diperluas di Phase 2 (`lint`, `typecheck`, `pretest`).

```json
{
  "name": "erpku-e2e",
  "version": "0.1.0",
  "private": true,
  "description": "Standalone Playwright E2E test suite for ERPku",
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:ui": "npx playwright test --ui",
    "test:debug": "npx playwright test --debug",
    "test:smoke": "npx playwright test --grep @smoke"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "typescript": "^5.8.0",
    "dotenv": "^16.5.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Design notes:**
- `private: true` — bukan NPM package, mencegah accidental publish.
- `dotenv` — load `.env` di `playwright.config.ts`. Sesuai [Playwright docs pattern](https://playwright.dev/docs/test-parameterize#env-files).
- Caret `^` versioning — minor updates tanpa breaking.
- `engines.node >= 18` — Playwright 1.52+ requirement.
- Scripts pakai `npx playwright test` — Phase 2 akan tambah composite scripts.

---

#### [NEW] `playwright.config.ts`

**Alasan**: Konfigurasi utama Playwright. Pola dotenv loading diambil dari official Playwright docs. Tidak ada `webServer` — standalone repo.

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file (satu file, default dev)
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,

  // ── Assertions ──────────────────────────────────────────────────
  expect: {
    timeout: 10_000,
  },

  // ── Reporters ───────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/html', open: 'never' }],
  ],

  // ── Shared Settings ─────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ── Browser Projects ────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment untuk cross-browser testing:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});
```

**Design notes:**
- `dotenv.config()` — load `.env` file eksplisit, sesuai official docs pattern `dotenv.config({ path: path.resolve(__dirname, '.env') })`.
- `testDir: './tests/specs'` — separasi specs dari pages/fixtures/utils. Mirror Python repo: `tests/e2e/` → di sini `tests/specs/`.
- `testMatch: '**/*.spec.ts'` — konvensi penamaan jelas, hanya file `.spec.ts` yang dijalankan.
- `fullyParallel: true` + `workers: 1` di CI — best practice Playwright: parallel lokal, sequential CI untuk stabilitas.
- `retries: 2` di CI — menangani flakiness. Lokal `0` agar developer langsung lihat error.
- `trace: 'on-first-retry'` — balance antara hemat disk dan debuggability. Sesuai plan Section 10.
- `baseURL` fallback `localhost:3000` — aman default, **wajib override** via `.env`.
- **Tidak ada `webServer`** — sesuai plan Section 10 ("Do not include frontend build-specific assumptions").
- Reporter: `list` di terminal + `html` di `reports/html/` — mirip Python repo yang generate `report.html`.

---

#### [NEW] `tsconfig.json`

**Alasan**: TypeScript config. Strict mode dari awal (plan Section 7.5). Path aliases sudah disiapkan per user request.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["tests/pages/*"],
      "@fixtures/*": ["tests/fixtures/*"],
      "@utils/*": ["tests/utils/*"],
      "@data/*": ["tests/data/*"]
    }
  },
  "include": [
    "playwright.config.ts",
    "tests/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

**Design notes:**
- `noEmit: true` — Playwright transpile TS secara internal (esbuild), tidak perlu compile step.
- `strict: true` — enforce type safety dari awal. Plan Section 7.5 quality gate.
- `paths` aliases — `@pages/*`, `@fixtures/*`, `@utils/*`, `@data/*`. Playwright natively support tsconfig paths. Alias ini akan dipakai mulai Phase 3.
- `resolveJsonModule: true` — import test data `.json` (Phase 3 `tests/data/users.json`).
- `module: "commonjs"` — Playwright test runner internal menggunakan CommonJS.
- `baseUrl: "."` — required agar `paths` bekerja, relatif dari root project.

---

#### [NEW] `.env.example`

**Alasan**: Template env vars. Satu file saja (keputusan Q1). Konvensi env var mengikuti plan Section 7.3 dan konsisten dengan Python repo [.env.dev.example](file:///c:/laragon/www/erpku-testing/erpku-automation-python/.env.dev.example).

```dotenv
# ── URL Aplikasi ─────────────────────────────────────────────────
# URL lengkap aplikasi yang akan ditest
BASE_URL=https://erp.dev.example.com/

# ── Nama Environment ─────────────────────────────────────────────
# Digunakan untuk logging dan conditional logic (dev | stg | prod)
ENV_NAME=dev

# ── Akun Test ────────────────────────────────────────────────────
TEST_USER_EMAIL=email_qa@dev.com
TEST_USER_PASSWORD=password_rahasia

# ── Browser Behavior (opsional) ──────────────────────────────────
# HEADLESS=true
# SLOW_MO=0
```

**Design notes:**
- Env vars identik dengan plan Section 7.3: `BASE_URL`, `ENV_NAME`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.
- `HEADLESS` dan `SLOW_MO` commented out — default Playwright sudah headless. Optional override untuk debug.
- Satu file `.env.example` → user copy ke `.env` dan isi value. Berbeda dari Python repo yang pakai `.env.dev.example` + `.env.stg.example`.
- Switching environment: cukup ganti value di `.env`, tidak perlu file terpisah.

---

#### [NEW] `.gitignore`

**Alasan**: Prevent secrets, build artifacts, dan generated reports masuk repo. Konsisten dengan Python repo [.gitignore](file:///c:/laragon/www/erpku-testing/erpku-automation-python/.gitignore) patterns.

```gitignore
# Dependencies
node_modules/

# Environment files (secrets)
.env
.env.*
!.env.example

# Playwright artifacts
test-results/
playwright-report/
blob-report/

# Reports (generated)
reports/
!reports/.gitkeep

# Auth state cache (login cookies/localStorage)
.auth/

# TypeScript
*.tsbuildinfo

# OS
.DS_Store
Thumbs.db

# IDEs
.idea/
*.swp
*.swo
.vscode/settings.json
```

**Design notes:**
- Konsisten dengan Python repo: `.env.*` (tapi whitelist `.env.example`), `.auth/`, `reports/`.
- `test-results/`, `playwright-report/` — default Playwright output dirs.
- `.auth/` — Phase 3 akan gunakan untuk stored auth state (mirip Python repo `.auth/state.json` pattern).

---

#### [NEW] `README.md`

**Alasan**: Setup guide untuk developer/QA baru. Gaya bahasa bilingual (section headers English, penjelasan mix) mengikuti konvensi Python repo [README.md](file:///c:/laragon/www/erpku-testing/erpku-automation-python/README.md).

````markdown
# 🎭 ERPku E2E Test Suite (Playwright + TypeScript)

Standalone Playwright E2E test repository for ERPku application.

## Prerequisites

- Node.js >= 18
- npm >= 9

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install --with-deps chromium
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` dan isi kredensial test:

```dotenv
BASE_URL=https://erp.dev.example.com/
ENV_NAME=dev
TEST_USER_EMAIL=your_qa_email@example.com
TEST_USER_PASSWORD=your_password
```

### 4. Run tests

```bash
# Run all tests
npm test

# Run smoke tests only
npm run test:smoke

# Run with browser visible
npm run test:headed

# Run with Playwright UI mode
npm run test:ui

# Debug mode
npm run test:debug
```

### 5. View reports

Setelah test selesai, buka HTML report:

```bash
npx playwright show-report ./reports/html
```

## Project Structure

```
tests/
├── specs/          # Test scenario files (*.spec.ts)
│   ├── smoke/      # Smoke tests (@smoke tag)
│   ├── auth/       # Authentication tests (Phase 4)
│   └── dashboard/  # Dashboard tests (Phase 4)
├── pages/          # Page Object Models (Phase 3)
├── fixtures/       # Custom test fixtures (Phase 3)
├── utils/          # Helper utilities (Phase 3)
├── data/           # Static test data (Phase 3)
└── support/        # Global setup/teardown (Phase 3)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_URL` | ✅ | Full URL aplikasi yang akan ditest |
| `ENV_NAME` | ❌ | Environment identifier (dev/stg/prod) |
| `TEST_USER_EMAIL` | ✅ | Email akun QA test |
| `TEST_USER_PASSWORD` | ✅ | Password akun QA test |

## Architecture Notes

- Repo ini **standalone** — tidak ada dependency ke frontend source code.
- Dirancang untuk bisa di-merge ke frontend repo nanti (`/e2e` atau `/packages/e2e-tests`).
- Semua konfigurasi driven by environment variables.
- Menggunakan TypeScript + strict mode untuk type safety.
````

---

#### [NEW] `tests/specs/smoke/smoke.spec.ts`

**Alasan**: Smoke test yang validate: (1) server HTTP responds, (2) landing page loads, (3) element spesifik ERPku visible (login form). Locator pattern di-derivasi dari Python repo [LoginPage](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/login_page.py) yang menggunakan multi-fallback selector.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests @smoke', () => {

  test('should return valid HTTP response from server', async ({ request }) => {
    // Verify server is reachable and responds with success status
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBeLessThan(400);
  });

  test('should load the application landing page', async ({ page }) => {
    await page.goto('/');

    // Verify page title is not empty
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verify the page is not a server error page
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('502 Bad Gateway');
    expect(bodyText).not.toContain('503 Service Unavailable');
    expect(bodyText).not.toContain('Cannot GET /');
  });

  test('should display login form elements on landing page', async ({ page }) => {
    await page.goto('/');

    // Verify email/username input field is visible
    // Multi-fallback selector: sesuai pola Python LoginPage yang support
    // name="username", name="email", type="email", type="text"
    const usernameInput = page.locator(
      "input[name='username'], input[name='email'], input[type='email']"
    );
    await expect(usernameInput.first()).toBeVisible();

    // Verify password input field is visible
    const passwordInput = page.locator(
      "input[name='password'], input[type='password']"
    );
    await expect(passwordInput.first()).toBeVisible();

    // Verify login button is visible
    // Multi-fallback: Login, Masuk, Sign In (bilingual support)
    const loginButton = page.getByRole('button', {
      name: /Login|Masuk|Sign In/i,
    });
    await expect(loginButton).toBeVisible();
  });

});
```

**Design notes:**
- `@smoke` tag di describe — `npm run test:smoke` pakai `--grep @smoke` untuk filter.
- **Test 1** (API): HTTP GET ke `baseURL` — prove server reachable tanpa browser overhead.
- **Test 2** (UI basic): Navigate, verify title non-empty, verify bukan error page.
- **Test 3** (UI elements): **ERPku-specific** — verify login form ada di landing page:
  - `input` email/username — multi-selector fallback persis seperti Python repo [LoginPage.input_username](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/login_page.py#L23-L25) (`input[name='username'], input[name='email'], input[type='email']`).
  - `input` password — multi-selector dari Python repo [LoginPage.input_password](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/login_page.py#L26-L28).
  - Button Login — `getByRole('button')` dengan regex bilingual `/Login|Masuk|Sign In/i`, sesuai Python repo [LoginPage.btn_login](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/login_page.py#L34-L36).
- **Tidak pakai POM class** — Phase 1 constraint. Locator inline di spec, akan di-refactor ke POM di Phase 3-4.
- `usernameInput.first()` — karena multi-selector bisa match multiple elements, ambil `.first()` untuk assertion.
- Semua URL pakai relative path (`/`) — resolved terhadap `baseURL` dari config.

---

#### [NEW] `.gitkeep` files (6 files)

```
tests/pages/.gitkeep
tests/fixtures/.gitkeep
tests/utils/.gitkeep
tests/data/.gitkeep
tests/support/.gitkeep
reports/.gitkeep
```

**Alasan**: Git tidak track empty directories. `.gitkeep` memastikan folder structure tercipta saat clone. Phase 2-3 tinggal drop file ke folder yang sudah ada.

---

### 1.3 Install & Run Commands

```powershell
# ── Step 1: Masuk ke project directory ───────────────────────────
# (jangan cd, jalankan dari root)

# ── Step 2: Install dependencies ─────────────────────────────────
npm install

# ── Step 3: Install Playwright browser binary ────────────────────
npx playwright install --with-deps chromium

# ── Step 4: Copy env template ────────────────────────────────────
copy .env.example .env
# Edit .env → isi BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD

# ── Step 5: Type check ──────────────────────────────────────────
npx tsc --noEmit

# ── Step 6: Run smoke test ───────────────────────────────────────
npm run test:smoke

# ── Step 7: View report ──────────────────────────────────────────
npx playwright show-report ./reports/html
```

---

### 1.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | `npm install` berhasil tanpa error | Run command, exit code 0 |
| 2 | `npx playwright install` berhasil | Chromium binary terinstall |
| 3 | Folder structure lengkap sesuai tree di 1.1 | Visual check |
| 4 | TypeScript compile tanpa error | `npx tsc --noEmit` exit code 0 |
| 5 | Smoke test jalan dan pass terhadap `BASE_URL` | `npm run test:smoke` → 3 tests passed |
| 6 | `BASE_URL` dibaca dari `.env`, bukan hardcoded | Grep codebase, tidak ada hardcoded URL |
| 7 | `.env` file tidak masuk Git | Check `.gitignore` rule |
| 8 | HTML report ter-generate di `reports/html/` | File exists setelah test run |
| 9 | Tidak ada dependency ke frontend source code | Tidak ada import dari luar `tests/` |
| 10 | `plan.md` sudah dihapus | File tidak ada di repo |

---

## Phase 2 — Core Project Standards (Detailed)

### Goal

Tambahkan quality gate: ESLint flat config + Prettier + `eslint-plugin-playwright` + composite npm scripts. Setelah Phase 2 selesai, setiap `npm test` akan otomatis jalankan lint → typecheck → Playwright tests.

> [!IMPORTANT]
> Phase 2 fokus pada **developer experience & code consistency**. Tidak ada test baru atau POM class. Semua tools bersifat pre-commit/pre-test quality gate.

### 2.1 File yang Harus Dibuat / Dimodifikasi

```
erpku-automation-nodejs/
├── eslint.config.mjs          [NEW]
├── .prettierrc                 [NEW]
├── .prettierignore             [NEW]
├── package.json                [MODIFY] — devDependencies + scripts
├── README.md                   [MODIFY] — tambah Development Workflow section
└── tests/specs/smoke/
    └── smoke.spec.ts           [MODIFY] — minor lint fix jika ada
```

**Total: 3 file baru, 3 file dimodifikasi.**

---

### 2.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `eslint.config.mjs`

**Alasan**: ESLint v9+ flat config format. Menggabungkan 3 config source: ESLint recommended, typescript-eslint recommended, dan eslint-plugin-playwright recommended. File `.mjs` karena ESLint flat config butuh ES modules.

```javascript
// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'reports/',
      '.auth/',
    ],
  },

  // ── Base: ESLint + TypeScript recommended ─────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── TypeScript file overrides ─────────────────────────────────────
  {
    files: ['**/*.ts'],
    rules: {
      // Relax rules yang terlalu strict untuk test code
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // ── Playwright test files ─────────────────────────────────────────
  {
    files: ['tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // expect().toBeTruthy() pattern yang kita pakai di smoke test
      'playwright/no-conditional-in-test': 'warn',
    },
  },
);
```

**Design notes:**
- **`tseslint.config()` helper** — dari `typescript-eslint` v8+, type-safe config builder. Lebih aman dari array manual.
- **3-layer config**: ESLint core → TypeScript rules → Playwright-specific rules (hanya untuk `*.spec.ts`).
- **`eslint-plugin-playwright`** — 50+ Playwright-specific rules: catch missing `await`, improper locator usage, anti-patterns yang bikin flaky tests. Scoped ke `tests/**/*.spec.ts` saja agar tidak interfere dengan non-test code (config, utils).
- **`argsIgnorePattern: '^_'`** — konvensi TypeScript, unused params yang di-prefix `_` tidak di-flag. Penting untuk destructured Playwright fixtures (`async ({ _page }) => ...`).
- **`ignores` block** — global ignores menggantikan `.eslintignore` (deprecated di flat config). Generated folders di-skip.

---

#### [NEW] `.prettierrc`

**Alasan**: Formatter config. Opinionated defaults, consisten dengan Playwright community style.

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "auto",
  "arrowParens": "always"
}
```

**Design notes:**
- `singleQuote: true` — sesuai existing code style di `smoke.spec.ts` dan `playwright.config.ts`.
- `trailingComma: "all"` — cleaner Git diffs.
- `printWidth: 100` — balance antara readability dan horizontal scrolling. Default 80 terlalu sempit untuk test code yang sering punya nested callbacks.
- `endOfLine: "auto"` — OS-agnostic (Windows CRLF / Linux LF). Penting karena user di Windows + kemungkinan CI di Linux.

---

#### [NEW] `.prettierignore`

**Alasan**: Prevent Prettier dari formatting generated/vendored files.

```
node_modules/
test-results/
playwright-report/
reports/
.auth/
package-lock.json
```

---

#### [MODIFY] `package.json`

**Alasan**: Tambah devDependencies untuk ESLint + Prettier toolchain, dan npm scripts untuk quality gates.

```json
{
  "name": "erpku-e2e",
  "version": "0.1.0",
  "private": true,
  "description": "Standalone Playwright E2E test suite for ERPku",
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "pretest": "npm run lint && npm run typecheck",
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:ui": "npx playwright test --ui",
    "test:debug": "npx playwright test --debug",
    "test:smoke": "npx playwright test --grep @smoke"
  },
  "devDependencies": {
    "@eslint/js": "^9.28.0",
    "@playwright/test": "^1.52.0",
    "@types/node": "^25.9.1",
    "dotenv": "^16.5.0",
    "eslint": "^9.28.0",
    "eslint-plugin-playwright": "^2.2.0",
    "prettier": "^3.5.0",
    "typescript": "^5.8.0",
    "typescript-eslint": "^8.33.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Design notes:**
- **`pretest` hook** — npm lifecycle: `npm test` otomatis jalankan `pretest` dulu. Pipeline: `lint → typecheck → playwright test`. Jika lint fail, test tidak jalan. Ini quality gate utama.
- **`format` vs `lint`** — separation of concerns: `prettier` handle formatting (spacing, semicolons), `eslint` handle logic errors (unused vars, missing awaits). Tidak pakai `eslint-plugin-prettier` atau `eslint-config-prettier` karena [Prettier docs merekomendasikan menjalankan terpisah](https://prettier.io/docs/en/integrating-with-linters.html).
- **`format:check`** — untuk CI: check tanpa auto-fix, fail jika ada formatting issue.
- **`typescript-eslint`** — single package yang bundle parser + plugin, menggantikan install terpisah `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` (pattern baru sejak v8).
- **`eslint-plugin-playwright`** — menambahkan Playwright-specific lint rules (missing await, prefer web-first assertions, dll.).

---

#### [MODIFY] `README.md`

**Alasan**: Tambahkan section Development Workflow dan Naming Conventions.

Tambahkan section berikut **setelah** section "## Architecture Notes":

````markdown
## Development Workflow

### Linting

```bash
# Check lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting (CI-friendly, no auto-fix)
npm run format:check
```

### Type Checking

```bash
npm run typecheck
```

### Full Quality Gate

`npm test` otomatis jalankan `lint → typecheck → playwright test`:

```bash
npm test
```

Atau jalankan smoke test saja (tanpa lint/typecheck):

```bash
npm run test:smoke
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Test file | `kebab-case.spec.ts` | `login.spec.ts`, `dashboard.spec.ts` |
| Page Object | `PascalCase.ts` | `LoginPage.ts`, `DashboardPage.ts` |
| Fixture file | `kebab-case.fixture.ts` | `auth.fixture.ts` |
| Utility file | `camelCase.ts` | `waitHelpers.ts`, `env.ts` |
| Test data | `kebab-case.json` | `users.json`, `test-data.json` |
| Test describe | Nama feature / halaman | `'Login Page'`, `'Dashboard'` |
| Test case | `should ...` | `'should display login form'` |
| Tag | `@kebab-case` di describe title | `'Smoke Tests @smoke'` |
| Variable | `camelCase` | `loginButton`, `usernameInput` |
| Const / enum | `UPPER_SNAKE` atau `PascalCase` | `BASE_URL`, `UserRole` |
````

---

#### [MODIFY] `tests/specs/smoke/smoke.spec.ts`

**Alasan**: Minor adjustments agar lulus `eslint-plugin-playwright` rules. Kemungkinan fix:
- `expect(response.ok()).toBeTruthy()` → bisa trigger `playwright/no-conditional-expect` tergantung versi plugin. Akan di-evaluate saat lint pertama kali dijalankan.
- Jika tidak ada lint error, file ini tidak perlu diubah.

> [!NOTE]
> Perubahan pada `smoke.spec.ts` akan minimal — hanya jika linting mengharuskan. File ini sudah ditulis mengikuti best practice. Akan di-verify saat `npm run lint` pertama kali.

---

### 2.3 Install & Run Commands

```powershell
# ── Step 1: Install new devDependencies ──────────────────────────
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-playwright prettier

# ── Step 2: Verify lint passes ───────────────────────────────────
npm run lint

# ── Step 3: Verify formatting ───────────────────────────────────
npm run format:check
# Jika ada formatting issues:
npm run format

# ── Step 4: Verify typecheck ────────────────────────────────────
npm run typecheck

# ── Step 5: Full quality gate + smoke test ───────────────────────
npm test

# ── Step 6: Verify smoke test masih pass (quick run) ─────────────
npm run test:smoke
```

---

### 2.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | `npm install` berhasil menambahkan ESLint + Prettier deps | `node_modules/.package-lock.json` punya eslint, prettier, typescript-eslint, eslint-plugin-playwright |
| 2 | `npm run lint` passes tanpa error | Exit code 0, no output |
| 3 | `npm run lint:fix` bisa auto-fix issues | Jalankan setelah intentional break, verify fix |
| 4 | `npm run format:check` passes | Exit code 0 |
| 5 | `npm run typecheck` passes | `tsc --noEmit` exit code 0 |
| 6 | `npm test` jalankan lint → typecheck → test | Output shows pretest hook running before Playwright |
| 7 | Existing 3 smoke tests tetap pass | `npm run test:smoke` → 3 tests passed |
| 8 | ESLint flat config valid (no deprecation warnings) | Tidak ada warning saat `npm run lint` |
| 9 | `eslint-plugin-playwright` aktif untuk `*.spec.ts` | Buat intentional error (missing await), verify lint catch |
| 10 | `.prettierrc` consistent dengan existing code style | Tidak ada reformatting saat `npm run format` pertama kali |
| 11 | README memiliki Development Workflow section | Visual check |
| 12 | README memiliki Naming Conventions table | Visual check |

---

## Phase 3 — Base Test Framework (Detailed)

### Goal

Build reusable framework components: BasePage class, typed env utility, custom Playwright fixtures, dan auth setup project. Migrasi pola dari Python repo ke idiom TypeScript + Playwright Test Runner native.

> [!IMPORTANT]
> Phase 3 fokus pada **framework internals** — BasePage, env utility, fixtures, auth caching. Tidak ada test spec baru kecuali 1 smoke test update untuk demo fixture. POM domain (LoginPage, DashboardPage) masuk Phase 4.

### 3.1 File yang Harus Dibuat / Dimodifikasi

```
erpku-automation-nodejs/
├── tests/
│   ├── pages/
│   │   └── BasePage.ts             [NEW] — abstract base class
│   ├── fixtures/
│   │   └── base.fixture.ts         [NEW] — extended test object
│   ├── utils/
│   │   └── env.ts                  [NEW] — typed env reader + validation
│   ├── data/
│   │   └── users.json              [NEW] — test user data structure
│   └── support/
│       └── auth.setup.ts           [NEW] — auth setup project (storageState)
├── playwright.config.ts            [MODIFY] — add setup project + storageState
└── tests/specs/smoke/
    └── smoke.spec.ts               [MODIFY] — import dari custom fixture (demo)
```

**Total: 5 file baru, 2 file dimodifikasi.**

---

### 3.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `tests/utils/env.ts`

**Alasan**: Typed env reader dengan validation. Port dari Python [settings.py](file:///c:/laragon/www/erpku-testing/erpku-automation-python/config/settings.py) — khususnya `_require_env()` dan `_require_secret_env()`. Menjadi satu-satunya tempat credentials diambil — mencegah env vars tersebar di banyak file.

```typescript
/**
 * Typed environment variable reader with validation.
 *
 * Port dari Python config/settings.py — semua env vars diakses melalui
 * module ini untuk konsistensi dan fail-fast jika config tidak lengkap.
 */

// ── Private Helpers ────────────────────────────────────────────────────────

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === null) {
    throw new Error(
      `[Config Error] Environment variable '${key}' tidak ditemukan.\n` +
        `Pastikan key '${key}' tersedia di file .env atau di environment CI.`,
    );
  }
  return value;
}

const UNSAFE_VALUES = new Set([
  '',
  'changeme',
  'change-me',
  'your_email',
  'your_password',
  'test@example.com',
  'qa@example.com',
  'invalid-password-placeholder',
]);

function requireSecretEnv(key: string): string {
  const value = requireEnv(key).trim();
  if (UNSAFE_VALUES.has(value.toLowerCase())) {
    throw new Error(
      `[Config Error] Environment variable '${key}' kosong atau masih placeholder.\n` +
        `Isi dengan credential QA yang valid di file .env lokal Anda.`,
    );
  }
  return value;
}

// ── Public Config Object ───────────────────────────────────────────────────

export const env = {
  /** Full URL aplikasi yang akan ditest */
  get BASE_URL(): string {
    return requireEnv('BASE_URL');
  },

  /** Environment name: dev | stg | prod */
  get ENV_NAME(): string {
    return requireEnv('ENV_NAME', 'dev');
  },

  /** Email/username akun QA test — validated as non-placeholder */
  get USER_EMAIL(): string {
    return requireSecretEnv('TEST_USER_EMAIL');
  },

  /** Password akun QA test — validated as non-placeholder */
  get USER_PASSWORD(): string {
    return requireSecretEnv('TEST_USER_PASSWORD');
  },
} as const;
```

**Design notes:**
- **Getter pattern** — sama seperti Python `@property`. Credentials di-resolve saat dipanggil (lazy), bukan saat import. Ini mencegah test discovery gagal karena env belum diisi.
- **`requireSecretEnv()`** — menolak placeholder umum (port langsung dari Python `_require_secret_env`). Penting karena `.env.example` berisi placeholder.
- **`as const`** — TypeScript akan infer tipe literal, autocomplete di IDE lebih presisi.
- **Tidak export fungsi internal** — hanya `env` object yang di-expose. Mencegah caller bypass validation.
- **Tidak pakai class** — object literal lebih ringan, tidak perlu instantiation. Sesuai TypeScript idiom.

---

#### [NEW] `tests/pages/BasePage.ts`

**Alasan**: Abstract base class untuk semua Page Object. Port subset essential dari Python [BasePage](file:///c:/laragon/www/erpku-testing/erpku-automation-python/pages/base_page.py) (670 baris) — dipilih methods yang akan digunakan Phase 4 (LoginPage, DashboardPage). Methods tambahan (MUI-specific, table, drag&drop) ditambahkan sesuai kebutuhan di phase-phase selanjutnya.

```typescript
import { type Locator, type Page, expect } from '@playwright/test';

/**
 * BasePage — fondasi untuk semua Page Object.
 *
 * Port dari Python BasePage dengan subset essential:
 * - Navigasi: navigate, waitForLoad, reload, goBack
 * - Interaksi: clickElement, fillInput, clearAndFill, typeSlowly,
 *              selectOption, checkCheckbox, uncheckCheckbox, hover
 * - Baca: getText, getAttribute, getInputValue, isVisible, isEnabled
 * - Menunggu: waitForElement, waitForElementHidden, waitForSpinnerGone
 * - Verifikasi: expectUrlContains, expectTitleContains
 * - Keyboard: pressKey, pressShortcut
 *
 * Methods MUI-specific (select_mui_option, fill_and_select_autocomplete, dll.)
 * ditambahkan di phase selanjutnya sesuai kebutuhan domain page.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  // ── NAVIGASI ───────────────────────────────────────────────────────────────

  /** Buka URL dan tunggu network idle. */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForLoad();
  }

  /** Tunggu sampai tidak ada network call selama 500ms. Fallback jika timeout. */
  async waitForLoad(timeout = 10_000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Long-polling atau SSE bisa bikin networkidle tidak pernah tercapai
      // — lanjut saja, halaman sudah visual-ready.
    }
  }

  /** Refresh halaman dan tunggu selesai dimuat. */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
  }

  /** Kembali ke halaman sebelumnya (browser back). */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForLoad();
  }

  // ── INTERAKSI ELEMEN ───────────────────────────────────────────────────────

  /** Klik dengan smart wait: visible + enabled + scroll into view. */
  async clickElement(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  /** Isi input field (clear dulu, lalu isi). */
  async fillInput(locator: Locator, text: string): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(text);
  }

  /** Kosongkan input lalu isi ulang — untuk edit field yang sudah ada value. */
  async clearAndFill(locator: Locator, text: string): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.fill('');
    await locator.fill(text);
  }

  /** Ketik karakter per karakter (bypass fill guard, trigger autocomplete). */
  async typeSlowly(locator: Locator, text: string, delay = 50): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEditable();
    await locator.scrollIntoViewIfNeeded();
    await locator.pressSequentially(text, { delay });
  }

  /** Pilih opsi pada <select> HTML standar. */
  async selectOption(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.selectOption(value);
  }

  /** Centang checkbox (idempotent). */
  async checkCheckbox(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.check();
  }

  /** Hapus centang checkbox (idempotent). */
  async uncheckCheckbox(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.uncheck();
  }

  /** Hover elemen untuk trigger dropdown/tooltip. */
  async hover(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded();
    await locator.hover();
  }

  // ── KEYBOARD ───────────────────────────────────────────────────────────────

  /** Tekan satu tombol keyboard (e.g. "Enter", "Escape", "Tab"). */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /** Tekan kombinasi tombol (e.g. pressShortcut("Control", "a")). */
  async pressShortcut(...keys: string[]): Promise<void> {
    await this.page.keyboard.press(keys.join('+'));
  }

  // ── BACA ELEMEN ────────────────────────────────────────────────────────────

  /** Ambil inner text dari elemen. */
  async getText(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    const text = await locator.innerText();
    return text.trim();
  }

  /** Ambil nilai attribute HTML dari elemen. */
  async getAttribute(locator: Locator, attribute: string): Promise<string> {
    await expect(locator).toBeVisible();
    return (await locator.getAttribute(attribute)) ?? '';
  }

  /** Ambil value dari input/textarea. */
  async getInputValue(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    const value = await locator.inputValue();
    return value.trim();
  }

  /** Cek visibilitas tanpa assertion — return boolean. */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /** Cek apakah elemen enabled (bukan disabled). */
  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  // ── MENUNGGU ───────────────────────────────────────────────────────────────

  /** Tunggu elemen muncul dan visible. */
  async waitForElement(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /** Tunggu elemen menghilang (hidden). */
  async waitForElementHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /** Tunggu MUI CircularProgress spinner hilang. */
  async waitForSpinnerGone(timeout = 15_000): Promise<void> {
    const spinner = this.page.locator('.MuiCircularProgress-root');
    if ((await spinner.count()) > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout });
    }
  }

  // ── VERIFIKASI HALAMAN ─────────────────────────────────────────────────────

  /** Assert URL saat ini mengandung teks tertentu. */
  async expectUrlContains(partial: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(partial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  /** Assert <title> tab mengandung teks tertentu. */
  async expectTitleContains(partial: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(partial, 'i'));
  }
}
```

**Design notes:**
- **`protected readonly page`** — TypeScript idiom: subclass bisa akses `this.page`, tapi caller di luar tidak bisa. `readonly` mencegah reassignment.
- **Semua method `async`** — Playwright Test pakai async API (beda dari Python yang sync). Setiap operasi harus `await`.
- **Subset 22 methods** — dari 35+ di Python. Yang di-skip: `doubleClick`, `rightClick`, `dragAndDrop`, `uploadFile`, `getCount`, `isChecked`, `getTableRowCount`, `getCellText`, `acceptDialog`, `dismissDialog`, `waitForToast`, dan semua MUI-specific. Ditambahkan on-demand di phase selanjutnya.
- **`waitForLoad()` fallback** — identik Python: `try/catch` untuk networkidle timeout. App ERPku pakai long-polling yang bikin networkidle flaky.
- **`clickElement()` smart wait** — visible → enabled → scroll → click. Persis Python pattern, mencegah klik elemen di-overlap oleh overlay.
- **`expectUrlContains()` escaping** — regex-escape input karena URL bisa punya karakter regex-special (`?`, `.`).
- **Tidak ada logging** — Playwright Test punya built-in tracing yang lebih kaya. Logging manual dihilangkan (beda dari Python yang pakai `logging.info`).

---

#### [NEW] `tests/support/auth.setup.ts`

**Alasan**: Auth setup project — pola resmi Playwright untuk reuse login state. Login 1x, simpan `storageState` ke `.auth/user.json`, semua test berikutnya pakai state ini tanpa re-login. Port dari Python conftest.py `authenticated_page` + `_do_fresh_login` + `_save_auth_state`.

```typescript
import { test as setup, expect } from '@playwright/test';
import { env } from '../utils/env';

const authFile = '.auth/user.json';

/**
 * Auth Setup — login sekali, simpan state untuk seluruh test suite.
 *
 * Port dari Python conftest.py:
 * - _do_fresh_login() → login via form UI
 * - _save_auth_state() → storageState ke file
 *
 * Playwright akan skip setup jika authFile sudah ada dan valid.
 * Hapus .auth/ folder untuk force re-login.
 */
setup('authenticate', async ({ page }) => {
  // ── Navigate ke login page ─────────────────────────────────────────
  await page.goto(env.BASE_URL);

  // ── Isi form login ─────────────────────────────────────────────────
  // Multi-fallback locator sesuai Python LoginPage
  const usernameInput = page.locator(
    "input[name='username'], input[name='email'], input[type='email']",
  );
  const passwordInput = page.locator("input[name='password'], input[type='password']");
  const loginButton = page.getByRole('button', { name: /Login|Masuk|Sign In/i });

  await usernameInput.first().fill(env.USER_EMAIL);
  await passwordInput.first().fill(env.USER_PASSWORD);
  await loginButton.click();

  // ── Tunggu redirect ke dashboard ───────────────────────────────────
  await page.waitForURL(/dashboard/i, { timeout: 15_000 });

  // ── Verify login berhasil ──────────────────────────────────────────
  // Sesuai Python DashboardPage.expect_to_be_loaded():
  // - URL contains "dashboard"
  // - Toast "Berhasil Login" visible
  // - Heading "Dashboard" visible
  await expect(page.getByText('Berhasil Login')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Dashboard').first()).toBeVisible();

  // ── Simpan auth state ──────────────────────────────────────────────
  await page.context().storageState({ path: authFile });
});
```

**Design notes:**
- **Setup project pattern** — [official Playwright auth recommendation](https://playwright.dev/docs/auth). Lebih idiomatis dari custom fixture + manual cache check. Playwright secara internal manage kapan setup perlu re-run.
- **Tidak pakai POM class** — Phase 3 belum punya LoginPage/DashboardPage POM. Inline locators saja. Di Phase 4, auth.setup.ts bisa di-refactor untuk pakai POM.
- **`env.USER_EMAIL` / `env.USER_PASSWORD`** — menggunakan env utility (bukan `process.env` langsung). Validation sudah ter-cover.
- **Multi-fallback locators** — copy dari smoke.spec.ts dan Python LoginPage. Konsisten cross-phase.
- **`authFile = '.auth/user.json'`** — path relatif dari project root. `.auth/` sudah di `.gitignore`.
- **Toast verification** — ERPku shows "Berhasil Login" toast. Tanpa ini, test bisa save state sebelum login benar-benar selesai (race condition).

---

#### [NEW] `tests/fixtures/base.fixture.ts`

**Alasan**: Extended `test` object dengan custom fixtures. Pola resmi Playwright untuk share setup/teardown. Untuk Phase 3, hanya berisi re-export `test` dan `expect` dari base — yang nanti diperluas di Phase 4 (POM fixtures) dan seterusnya.

```typescript
import { test as base } from '@playwright/test';

/**
 * Custom test fixture yang di-extend dari base Playwright test.
 *
 * Saat ini re-export base test — belum ada fixture tambahan.
 * Phase 4 akan extend dengan POM fixtures (loginPage, dashboardPage).
 *
 * Semua spec file harus import { test, expect } dari sini,
 * BUKAN dari '@playwright/test' langsung.
 *
 * Ini memastikan saat fixture baru ditambahkan, semua test
 * otomatis mendapat akses tanpa perlu ubah import.
 */
export const test = base;
export { expect } from '@playwright/test';
```

**Design notes:**
- **Re-export pattern** — ini adalah "seam" yang memudahkan Phase 4 extend tanpa harus refactor semua import. Pola ini umum di Playwright project besar.
- **Belum ada fixture tambahan** — intentional. Phase 3 setup auth via setup project (bukan fixture). POM fixtures masuk Phase 4.
- **Mengapa `base.fixture.ts` bukan `test.ts`?** — penamaan `base.fixture.ts` sesuai naming convention di README (fixture files: `kebab-case.fixture.ts`). Juga lebih deskriptif daripada `test.ts`.

---

#### [NEW] `tests/data/users.json`

**Alasan**: Static test user data. Struktur ini akan dipakai Phase 4 untuk parameterized login tests (valid user, invalid password, empty fields). Dipisah dari code agar mudah diubah tanpa sentuh test logic.

```json
{
  "validUser": {
    "description": "Akun QA utama — credentials dari env vars",
    "emailSource": "TEST_USER_EMAIL",
    "passwordSource": "TEST_USER_PASSWORD"
  },
  "invalidPassword": {
    "description": "Akun dengan password salah untuk test login fail",
    "email": "kaautomation",
    "password": "WrongPassword123!"
  },
  "emptyCredentials": {
    "description": "Skenario semua field kosong",
    "email": "",
    "password": ""
  }
}
```

**Design notes:**
- **`validUser` reference env vars** — tidak hardcode credentials di JSON. Nilai aktual tetap dibaca dari `env.ts` saat test jalan. Field `emailSource`/`passwordSource` adalah referensi, bukan value.
- **`invalidPassword`** — hardcoded karena ini memang bukan real credential.
- **Minimal structure** — Phase 4 akan extend sesuai kebutuhan test scenarios.

---

#### [MODIFY] `playwright.config.ts`

**Alasan**: Tambahkan setup project untuk auth, dan configure `storageState` di browser project agar semua test otomatis mendapat session yang sudah login.

Perubahan:
1. Tambah `testDir: './tests'` di level root (bukan `./tests/specs`) agar setup project terdeteksi.
2. Tambah setup project yang match `*.setup.ts`.
3. Tambah `storageState` dan `dependencies` di chromium project.
4. Override `testMatch` di chromium project agar tetap hanya run `*.spec.ts`.

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file (satu file, default dev)
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './tests',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,

  // ── Assertions ──────────────────────────────────────────────────
  expect: {
    timeout: 10_000,
  },

  // ── Reporters ───────────────────────────────────────────────────
  reporter: [['list'], ['html', { outputFolder: './reports/html', open: 'never' }]],

  // ── Shared Settings ─────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ── Browser Projects ────────────────────────────────────────────
  projects: [
    // Auth setup — login sekali, simpan state
    {
      name: 'setup',
      testDir: './tests/support',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pakai auth state dari setup project
        storageState: '.auth/user.json',
      },
      testDir: './tests/specs',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
    },
    // Uncomment untuk cross-browser testing:
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: '.auth/user.json',
    //   },
    //   testDir: './tests/specs',
    //   testMatch: '**/*.spec.ts',
    //   dependencies: ['setup'],
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});
```

**Design notes:**
- **Setup project pattern** — official Playwright auth approach. `dependencies: ['setup']` artinya chromium tests hanya jalan setelah setup berhasil.
- **`testDir` split** — setup project: `./tests/support`, chromium project: `./tests/specs`. Ini menggantikan `testDir` global yang sebelumnya `./tests/specs`.
- **`testMatch: /.*\.setup\.ts/`** — regex pattern, hanya match file `*.setup.ts` di support folder.
- **`storageState: '.auth/user.json'`** — semua test di chromium project otomatis mendapat session login. Tidak perlu custom fixture.
- **Smoke test HTTP request** — test pertama (`should return valid HTTP response`) pakai `request` fixture, tidak perlu auth. Tapi karena `storageState` di level project, request juga akan punya cookies. Ini aman — HTTP test hanya cek status code.

> [!WARNING]
> Perubahan `playwright.config.ts` ini mengubah `testDir` dan menambah setup project. Smoke test yang sebelumnya jalan tanpa login sekarang akan **bergantung pada auth setup**. Ini berarti `npm run test:smoke` akan gagal jika credentials belum diisi di `.env`. Ini acceptable karena credential sudah tersedia dari Phase 1.

---

#### [MODIFY] `tests/specs/smoke/smoke.spec.ts`

**Alasan**: Ubah import dari `@playwright/test` ke custom fixture `@fixtures/base.fixture`. Ini demo bahwa path alias dan fixture pipeline berfungsi. Logic test tidak berubah.

Perubahan minimal — hanya baris import pertama:

```diff
-import { test, expect } from '@playwright/test';
+import { test, expect } from '../../fixtures/base.fixture';
```

**Design notes:**
- **Relative import** bukan `@fixtures/*` — karena tsconfig path aliases belum di-resolve oleh Playwright test runner secara native untuk `.ts` imports (hanya resolve saat typecheck). Playwright docs merekomendasikan relative imports. Alias tetap berguna untuk typecheck dan IDE navigation.
- **Tidak ada perubahan logic** — hanya import source berubah. Semua 3 test tetap identik.

> [!NOTE]
> Di Phase 4, saat POM fixtures ditambahkan ke `base.fixture.ts`, semua test yang sudah import dari sini akan otomatis mendapat akses ke fixture baru tanpa perlu ubah import.

---

### 3.3 Install & Run Commands

```powershell
# ── Step 1: Tidak perlu install dependency baru ──────────────────
# Phase 3 hanya menambahkan TypeScript files, tidak ada npm package baru.

# ── Step 2: Verify TypeScript compiles ───────────────────────────
npm run typecheck

# ── Step 3: Verify lint passes ───────────────────────────────────
npm run lint

# ── Step 4: Verify format ───────────────────────────────────────
npm run format:check
# Jika ada formatting issues:
npm run format

# ── Step 5: Hapus auth state lama (jika ada) ────────────────────
Remove-Item -Recurse -Force .auth -ErrorAction SilentlyContinue

# ── Step 6: Run full test suite (setup + smoke) ──────────────────
npm test
# Expected output:
#   Running setup project...
#   [setup] › tests/support/auth.setup.ts:X:X › authenticate
#   Running chromium project...
#   [chromium] › tests/specs/smoke/smoke.spec.ts:X:X › Smoke Tests @smoke › ...
#   4 passed (auth setup + 3 smoke tests)

# ── Step 7: Run smoke test only (skip auth jika state ada) ───────
npm run test:smoke
# Expected: 3 passed (auth setup di-cache, tidak re-login)

# ── Step 8: Verify auth state file ter-generate ──────────────────
Test-Path .auth/user.json
# Expected: True
```

---

### 3.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | `npm run typecheck` passes — semua file baru valid TypeScript | `tsc --noEmit` exit code 0 |
| 2 | `npm run lint` passes — BasePage, env.ts, auth.setup.ts, base.fixture.ts sesuai ESLint rules | Exit code 0, no errors |
| 3 | `npm run format:check` passes | Exit code 0 |
| 4 | Auth setup jalan dan login berhasil | `[setup] › auth.setup.ts › authenticate` passed di test output |
| 5 | `.auth/user.json` ter-generate setelah test run | File exists + berisi cookies/localStorage |
| 6 | 3 smoke tests tetap pass (tidak ada regression) | `npm run test:smoke` → 3 passed |
| 7 | Smoke test import dari custom fixture, bukan `@playwright/test` | Grep `smoke.spec.ts` line 1 → `from '../../fixtures/base.fixture'` |
| 8 | `env.ts` validation berfungsi — hapus `TEST_USER_EMAIL` dari `.env`, verify error message | Error: `[Config Error] Environment variable 'TEST_USER_EMAIL' tidak ditemukan` |
| 9 | `BasePage.ts` exportable — import di REPL/test tidak error | `npx tsc --noEmit` (covers import resolution) |
| 10 | `users.json` importable — `import users from '@data/users.json'` compiles | `npx tsc --noEmit` verifies `resolveJsonModule` |
| 11 | `storageState` di config menunjuk ke `.auth/user.json` | Grep `playwright.config.ts` → `storageState: '.auth/user.json'` |
| 12 | Setup project punya `dependencies` relationship | Grep `playwright.config.ts` → `dependencies: ['setup']` |

---

## Phase 4 — First Real User Flows (Detailed)

### Goal

Automate critical application flows menggunakan POM yang di-extend ke custom fixture. Port test scenarios fungsional utama dari Python repo: LoginPage POM, DashboardPage POM, skenario login lengkap (sukses, gagal, validasi form kosong), dan skenario logout.

### 4.1 File yang Harus Dibuat / Dimodifikasi

```
erpku-automation-nodejs/
├── tests/
│   ├── pages/
│   │   ├── LoginPage.ts            [NEW] — POM Halaman Login
│   │   └── DashboardPage.ts        [NEW] — POM Halaman Dashboard
│   ├── fixtures/
│   │   └── base.fixture.ts         [MODIFY] — extend base test dengan POM fixtures
│   ├── specs/
│   │   ├── auth/
│   │   │   └── login.spec.ts       [NEW] — login suite (5 skenario)
│   │   ├── dashboard/
│   │   │   └── dashboard.spec.ts   [NEW] — dashboard suite (2 skenario)
│   │   └── smoke/
│   │       └── smoke.spec.ts       [MODIFY] — refaktor untuk menggunakan LoginPage POM
```

**Total: 4 file baru, 2 file dimodifikasi.**

---

### 4.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `tests/pages/LoginPage.ts`

**Alasan**: Page Object Model untuk halaman Login. Mengenkapsulasi selector multi-fallback dan method interaksi login.

```typescript
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../utils/env';

/**
 * Domain: Auth
 * Page: / (root)
 *
 * Page Object Model untuk Halaman Login ERPku.
 * Port dari Python login_page.py.
 */
export class LoginPage extends BasePage {
  // ── FORM INPUT ─────────────────────────────────────────────────────────────
  public readonly inputUsername: Locator;
  public readonly inputPassword: Locator;
  public readonly inputRemember: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnLogin: Locator;

  constructor(page: Page) {
    super(page);

    // Selector multi-fallback untuk kompatibilitas antar environment
    this.inputUsername = page.locator(
      "input[name='username'], input[name='email'], input[type='email'], input[type='text']",
    );
    this.inputPassword = page.locator("input[name='password'], input[type='password']");
    this.inputRemember = page.getByLabel(/Remember me|Ingat saya/i).first();

    this.btnLogin = page.getByRole('button', { name: /Login|Masuk|Sign In/i });
  }

  /** Buka halaman login ERPku */
  async goto(): Promise<void> {
    await this.navigate(env.BASE_URL);
  }

  /** Aksi utama login: isi formulir lalu submit */
  async doLogin(username?: string, password?: string, rememberMe = false): Promise<void> {
    if (username !== undefined && username !== '') {
      await this.fillInput(this.inputUsername, username);
    } else if (username === '') {
      // Intentional clear untuk testing input kosong
      await this.inputUsername.first().fill('');
    }

    if (password !== undefined && password !== '') {
      await this.fillInput(this.inputPassword, password);
    } else if (password === '') {
      // Intentional clear untuk testing input kosong
      await this.inputPassword.first().fill('');
    }

    if (rememberMe) {
      await this.checkCheckbox(this.inputRemember);
    }
    await this.clickElement(this.btnLogin);
  }
}
```

**Design notes:**
- **Encapsulates Locators**: Locators didefinisikan sebagai `public readonly` sehingga test specs bisa meng-assert visibilitasnya jika diperlukan (misal: di smoke test).
- **Flexible doLogin**: Menerima parameter opsional. Jika bernilai `""` (empty string), system akan eksplisit mengosongkan field untuk men-trigger frontend validation.

---

#### [NEW] `tests/pages/DashboardPage.ts`

**Alasan**: Page Object Model untuk Halaman Dashboard. Mengenkapsulasi verifikasi loading dashboard dan aksi logout.

```typescript
import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Domain: Global
 * Page: /dashboard
 *
 * Page Object Model untuk Halaman Dashboard ERPku.
 * Port dari Python dashboard_page.py.
 */
export class DashboardPage extends BasePage {
  // ── HEADER / VISUALS ───────────────────────────────────────────────────────
  public readonly heading: Locator;
  public readonly textSapaan: Locator;

  // ── TOMBOL AKSI ────────────────────────────────────────────────────────────
  public readonly btnProfile: Locator;
  public readonly btnLogout: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByText('Dashboard').first();
    this.textSapaan = page.getByText(/h[ae]lo/i);
    this.btnProfile = page.getByRole('button', { name: 'open profile' });
    // .last() mengambil opsi logout dari dropdown list profile karena ada logout button lain di sidebar
    this.btnLogout = page.getByRole('button', { name: 'Logout' }).last();
  }

  /** Verifikasi halaman Dashboard berhasil dimuat seutuhnya */
  async expectToBeLoaded(): Promise<void> {
    await this.expectUrlContains('dashboard');
    const toastSuccess = this.page.getByText('Berhasil Login', { exact: false });
    await expect(toastSuccess).toBeVisible({ timeout: 10_000 });
    await expect(this.textSapaan).toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  /** Aksi keluar log out dari profile saat ini */
  async doLogout(): Promise<void> {
    await this.clickElement(this.btnProfile);
    await this.clickElement(this.btnLogout);
  }
}
```

---

#### [MODIFY] `tests/fixtures/base.fixture.ts`

**Alasan**: Memperluas base test Playwright untuk menyuntikkan `loginPage` dan `dashboardPage` POM secara otomatis ke setiap test spec.

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Extended MyFixtures type untuk Page Object Models
 */
type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

/**
 * Custom test fixture yang di-extend dari base Playwright test.
 * Menyediakan instance LoginPage dan DashboardPage secara otomatis.
 */
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
```

---

#### [NEW] `tests/specs/auth/login.spec.ts`

**Alasan**: Memasukkan 5 skenario login lengkap dari Python `test_login.py`. Menggunakan `test.use()` untuk reset storageState agar skenario login tidak terganggu oleh cache session global.

```typescript
import { test, expect } from '../../fixtures/base.fixture';
import { env } from '../../utils/env';
import users from '../../data/users.json';

test.describe('Login Scenario Suite @auth @login', () => {
  // Reset storageState agar pengetesan login selalu berjalan dalam state unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-LOGIN-001: should login successfully with Remember Me', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, env.USER_PASSWORD, true);

    // Verify redirect dan elemen dashboard tampil
    await dashboardPage.expectToBeLoaded();
  });

  test('TC-LOGIN-002: should fail login with incorrect password', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, users.invalidPassword.password);

    // Verify Toast error muncul
    const toastError = page.getByText(/Nama akun atau kata sandi salah|Invalid credentials|Wrong email or password/i);
    await expect(toastError).toBeVisible();

    // Pastikan url tidak bergeser ke dashboard
    await expect(page).not.toHaveURL(/.*\/dashboard/);
  });

  test('TC-LOGIN-003: should show validation helper when username is empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin('', users.invalidPassword.password);

    // Verify helper text muncul
    const helperText = page.getByText(/username harus diisi|email is required|username is required/i);
    await expect(helperText).toBeVisible();
  });

  test('TC-LOGIN-004: should show validation helper when password is empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, '');

    // Verify helper text muncul
    const helperText = page.getByText(/password harus diisi|password is required/i);
    await expect(helperText).toBeVisible();
  });

  test('TC-LOGIN-005: should show validations when both credentials are empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin('', '');

    // Verify kedua helper text muncul
    const helperUser = page.getByText(/username harus diisi|email is required|username is required/i);
    const helperPass = page.getByText(/password harus diisi|password is required/i);
    await expect(helperUser).toBeVisible();
    await expect(helperPass).toBeVisible();
  });
});
```

---

#### [NEW] `tests/specs/dashboard/dashboard.spec.ts`

**Alasan**: Skenario pengujian dashboard. Menggunakan session caching global secara otomatis tanpa repot re-login.

```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('Dashboard Page Suite @dashboard', () => {
  // Test ini secara default mewarisi storageState ter-autentikasi dari setup project

  test('TC-DASH-001: should display dashboard main elements successfully', async ({
    page,
    dashboardPage,
  }) => {
    // Navigate ke dashboard
    await page.goto('/dashboard');

    // Pastikan tombol profil visible
    await expect(dashboardPage.btnProfile).toBeVisible();
    // Pastikan tulisan header dashboard visible
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('TC-DASH-002: should log out successfully from dashboard', async ({
    page,
    dashboardPage,
  }) => {
    await page.goto('/dashboard');

    // Lakukan logout
    await dashboardPage.doLogout();

    // Pastikan ter-redirect ke halaman login/root luar
    await expect(page).not.toHaveURL(/.*\/dashboard/);
    await expect(page).toHaveURL(/.*(login|\/)/);
  });
});
```

---

#### [MODIFY] `tests/specs/smoke/smoke.spec.ts`

**Alasan**: Refaktor total untuk memanfaatkan `LoginPage` POM fixture yang baru dibangun. Mencegah code duplication selector.

```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('Smoke Tests @smoke', () => {
  test('should return valid HTTP response from server', async ({ request }) => {
    // Verify server is reachable and responds with success status
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBeLessThan(400);
  });

  test('should load the application landing page', async ({ loginPage }) => {
    await loginPage.goto();

    // Verify page title is not empty
    const title = await loginPage.page.title();
    expect(title).toBeTruthy();

    // Verify the page is not a server error page
    const bodyText = await loginPage.page.locator('body').textContent();
    expect(bodyText).not.toContain('502 Bad Gateway');
    expect(bodyText).not.toContain('503 Service Unavailable');
    expect(bodyText).not.toContain('Cannot GET /');
  });

  test('should display login form elements on landing page', async ({ loginPage }) => {
    await loginPage.goto();

    // Verify email/username input field is visible
    await expect(loginPage.inputUsername.first()).toBeVisible();

    // Verify password input field is visible
    await expect(loginPage.inputPassword.first()).toBeVisible();

    // Verify login button is visible
    await expect(loginPage.btnLogin).toBeVisible();
  });
});
```

---

### 4.3 Install & Run Commands

```powershell
# ── Step 1: Jalankan Typecheck Quality Gate ────────────────────────
npm run typecheck

# ── Step 2: Jalankan Linter Gate ──────────────────────────────────
npm run lint

# ── Step 3: Jalankan Full Suite Test (termasuk Auth & Dashboard) ──
npm test

# ── Step 4: Jalankan Uji Coba Per-Feature ──────────────────────────
# Jalankan skenario auth login saja (dengan state unauthenticated)
npx playwright test --grep @auth

# Jalankan skenario dashboard saja (menggunakan cached session)
npx playwright test --grep @dashboard
```

---

### 4.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | `npm run typecheck` lulus 100% | TypeScript compiles clean |
| 2 | `npm run lint` lulus 100% | ESLint tidak melempar warning/error pada POM & Specs baru |
| 3 | Fixtures menyuntikkan `loginPage` & `dashboardPage` dengan benar | compile-safe dan autocomplete aktif di VSCode |
| 4 | `login.spec.ts` berjalan unauthenticated | Menggunakan state bersih, bypass caching global |
| 5 | `dashboard.spec.ts` berjalan authenticated | Tidak memicu proses login manual di UI, langsung di halaman dashboard |
| 6 | Aksi Logout membuang user kembali ke halaman login | URL berubah, locator halaman login terdeteksi |
| 7 | Smoke tests berhasil ter-refactor ke POM | Tidak ada inline selector `page.locator(...)` tersisa di `smoke.spec.ts` |
| 8 | Skenario invalid credentials memicu toast error | Assert `toastError` visible |
| 9 | Skenario field kosong memicu helper texts frontend | Assert `helperText` visible |
| 10 | Seluruh total spec test suite (≥10 tests) passed | `npm test` exit code 0 |

---

## Phase 5 — CI Integration (Detailed)

### Goal

Menjalankan seluruh E2E test suite secara otomatis di CI pipeline menggunakan GitHub Actions. Pipeline ini mencakup quality gates (linting, typechecking), instalasi dependency/browser terisolasi, inject secrets, eksekusi test, dan pengunggahan hasil HTML report sebagai workflow artifacts.

### 5.1 File yang Harus Dibuat / Dimodifikasi

```
erpku-automation-nodejs/
└── .github/
    └── workflows/
        └── playwright.yml          [NEW] — GitHub Actions Workflow
```

**Total: 1 file baru.**

---

### 5.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `.github/workflows/playwright.yml`

**Alasan**: Pipeline otomatisasi di GitHub Actions. Menggunakan runner `ubuntu-latest`, caching dependency npm untuk efisiensi waktu run, menginstal hanya browser chromium untuk efisiensi disk, menguji dengan quality gates penuh (`npm test` otomatis memicu lint & typecheck terlebih dahulu), dan mengunggah artifact HTML report yang dapat diunduh kapan saja (retensi 30 hari).

```yaml
name: Playwright E2E Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to run tests against'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging

jobs:
  test:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright Chromium Browser
      run: npx playwright install --with-deps chromium

    - name: Run Playwright tests
      env:
        BASE_URL: ${{ secrets.BASE_URL }}
        ENV_NAME: ${{ github.event.inputs.environment || 'dev' }}
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      run: npm test

    - name: Upload Playwright HTML Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: reports/html/
        retention-days: 30
```

**Design notes:**
- **`workflow_dispatch`**: Mendukung pemicu manual (*manual dispatch*) di GitHub UI dengan opsi pilihan environment (dev/staging).
- **`npm ci`**: Menggunakan instalasi bersih berbasis `package-lock.json` untuk menjamin konsistensi versi package di CI runner.
- **`install --with-deps chromium`**: Menghemat ruang disk dan memotong waktu instalasi browser hingga 60% dengan hanya men-download binary chromium (karena suite kita saat ini dioptimalkan khusus untuk desktop chrome).
- **`always()`**: Menjamin artifact HTML report selalu diunggah, baik saat seluruh test sukses maupun saat ada salah satu test spec yang gagal (*failure trace*).
- **`timeout-minutes: 15`**: Melindungi kuota runner GitHub Actions dari loop tak terbatas jika terjadi kebocoran memori atau kondisi hang di browser.

---

### 5.3 Install & Run Commands

```bash
# Workflow ini dijalankan otomatis oleh GitHub Actions.
# Untuk melakukan uji coba linter workflow secara lokal, dapat menggunakan tools seperti 'act' (jika terinstall).
```

---

### 5.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | File `.github/workflows/playwright.yml` terbentuk | File exists |
| 2 | Pemicu push/PR mengarah ke main & master | Visual check pada `on` block |
| 3 | Mendukung manual dispatch trigger | Visual check pada `workflow_dispatch` block |
| 4 | Runner menggunakan Ubuntu-latest & Node 18 | Runner spec valid |
| 5 | Dependency diinstall menggunakan `npm ci` | Konsisten dan aman untuk CI |
| 6 | Hanya browser chromium yang diunduh beserta OS dependencies-nya | Perintah `playwright install --with-deps chromium` tertera |
| 7 | Menggunakan secret repository untuk credentials | `secrets.BASE_URL`, `secrets.TEST_USER_EMAIL`, `secrets.TEST_USER_PASSWORD` ter-inject dengan benar |
| 8 | Quality gates (lint + typecheck) dijalankan sebelum tests | Panggilan `npm test` (yang memicu `pretest`) tertera |
| 9 | Artifact HTML report diunggah pada kondisi apa pun (selalu) | `if: always()` tertera |
| 10 | Retensi artifact report dibatasi 30 hari | `retention-days: 30` tertera |

---

## Phase 6 — Merge-Ready Preparation (Detailed)

### Goal

Menjamin seluruh repositori pengujian E2E ini dapat dipindahkan dan diintegrasikan secara mulus ke dalam repositori utama frontend (baik sebagai folder mandiri `/e2e` maupun sebagai workspace package di bawah monorepo `/packages/e2e-tests`). Menyusun panduan migrasi tertulis dan template konfigurasi alternatif berbasis `webServer` untuk mempermudah developer menyalakan local development server secara otomatis sebelum test berjalan.

### 6.1 File yang Harus Dibuat / Dimodifikasi

```
erpku-automation-nodejs/
├── MIGRATION.md                    [NEW] — Dokumen Panduan Migrasi Lengkap
└── playwright.config.monorepo.ts   [NEW] — Konfigurasi Playwright Alternatif Monorepo (webServer)
```

**Total: 2 file baru.**

---

### 6.2 Isi Tiap File & Alasan Desain

---

#### [NEW] `MIGRATION.md`

**Alasan**: Panduan instruksi tertulis bagi tim engineering untuk memindahkan test suite ini ke repositori frontend utama. Menjelaskan skenario non-monorepo (copy-paste direct folder) dan monorepo (Yarn/NPM/PNPM workspaces) secara lengkap.

```markdown
# 🚀 ERPku E2E Testing Suite — Migration & Merge Guide

Dokumen ini memandu Anda memindahkan dan mengintegrasikan repositori testing Playwright + TypeScript standalone ini ke dalam **repositori frontend utama ERPku**.

---

## 📌 Skenario Integrasi

Pilih salah satu dari 2 skenario integrasi berikut yang sesuai dengan struktur folder repositori frontend Anda:

### Skenario A: Folder Mandiri (`/e2e` atau `/tests/e2e`)
Gunakan skenario ini jika repositori frontend utama Anda berupa single project (bukan monorepo).

1. **Salin Folder & Berkas Utama**:
   Salin folder dan berkas berikut dari repositori ini ke dalam folder root repositori frontend Anda:
   * Folder `tests/` $\rightarrow$ masukkan ke folder `/e2e` atau `/tests/e2e`.
   * Berkas `tsconfig.json` $\rightarrow$ salin mapping `paths` (aliases) ke dalam `tsconfig.json` frontend Anda.
   * Berkas `.env.example` $\rightarrow$ salin isinya ke `.env.example` frontend.
   * Berkas `eslint.config.mjs` $\rightarrow$ gabungkan aturan playwright ke config eslint frontend Anda.
   * Berkas `.github/workflows/playwright.yml` $\rightarrow$ salin ke folder `.github/workflows/` frontend.

2. **Gabungkan Dependencies (`package.json`)**:
   Tambahkan devDependencies dan scripts berikut ke dalam `package.json` utama frontend Anda:
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:smoke": "playwright test --grep @smoke"
     },
     "devDependencies": {
       "@playwright/test": "^1.52.0",
       "eslint-plugin-playwright": "^2.2.0"
     }
   }
   ```

3. **Gunakan Konfigurasi Playwright**:
   Salin `playwright.config.ts` ke root frontend, lalu sesuaikan nilai `testDir` jika Anda memindahkan folder ke `/e2e` (ubah `testDir` dari `./tests` menjadi `./e2e`).

---

### Skenario B: Monorepo Package (`/packages/e2e-tests`)
Gunakan skenario ini jika repositori frontend Anda berbasis Yarn/PNPM/NPM Workspaces.

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
   Di dalam monorepo, sangat direkomendasikan untuk menyalakan frontend server lokal secara otomatis sebelum testing dimulai. Gunakan template config **`playwright.config.monorepo.ts`** yang telah disediakan di folder root package ini.

---

## 🛠️ Menggunakan WebServer (Local Dev Server)

Dalam repositori standalone saat ini, testing dilakukan terhadap server yang sudah aktif (`BASE_URL` eksternal). Setelah digabungkan ke repositori frontend, Anda dapat menyalakan server lokal secara otomatis oleh Playwright:

1. Ganti berkas `playwright.config.ts` Anda dengan isi dari `playwright.config.monorepo.ts`.
2. Sesuaikan bagian `webServer` dengan command build/start frontend Anda:
   ```typescript
   webServer: {
     command: 'npm run dev',             // Command menyalakan frontend lokal Anda
     url: 'http://localhost:5173',       // URL lokal tempat server menyala
     reuseExistingServer: !process.env.CI,
     timeout: 120_000,
   }
   ```

---

## 🔒 Manajemen Secrets di CI (GitHub Actions)

Setelah merger, pastikan Anda menambahkan repository secrets berikut di halaman GitHub Settings repositori utama Anda:
* `BASE_URL`: URL utama aplikasi web target.
* `TEST_USER_EMAIL`: Email credential uji QA.
* `TEST_USER_PASSWORD`: Password credential uji QA.
```

---

#### [NEW] `playwright.config.monorepo.ts`

**Alasan**: Berkas konfigurasi alternatif untuk mencontohkan integrasi monorepo dengan menyertakan blok `webServer`. Ini mempermudah Playwright menyalakan, memantau, dan mematikan server lokal frontend secara otomatis.

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file (satu file, default dev)
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './tests',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,

  // ── Assertions ──────────────────────────────────────────────────
  expect: {
    timeout: 10_000,
  },

  // ── Reporters ───────────────────────────────────────────────────
  reporter: [['list'], ['html', { outputFolder: './reports/html', open: 'never' }]],

  // ── Shared Settings ─────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ── WebServer (Monorepo Integration) ────────────────────────────
  // Jalankan frontend server lokal secara otomatis sebelum testing dimulai
  webServer: {
    command: 'npm run dev', // Sesuaikan command startup frontend Anda (misal: pnpm dev, npm run dev)
    url: process.env.BASE_URL || 'http://localhost:5173', // Sesuaikan port default local dev Anda
    reuseExistingServer: !process.env.CI, // Gunakan server lokal yang sudah menyala (tidak perlu restart di lokal)
    timeout: 120_000, // Berikan waktu 2 menit bagi server untuk fully booted up
  },

  // ── Browser Projects ────────────────────────────────────────────
  projects: [
    // Auth setup — login sekali, simpan state
    {
      name: 'setup',
      testDir: './tests/support',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pakai auth state dari setup project
        storageState: '.auth/user.json',
      },
      testDir: './tests/specs',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
    },
    // Uncomment untuk cross-browser testing:
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: '.auth/user.json',
    //   },
    //   testDir: './tests/specs',
    //   testMatch: '**/*.spec.ts',
    //   dependencies: ['setup'],
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});
```

---

### 6.3 Audit & Portability Check

1. **Grep Absolute Paths**: Melakukan verifikasi bahwa tidak ada absolute path file local yang bocor ke spec files maupun config. Seluruh file menggunakan relative path yang portabel.
2. **Grep Hardcoded URLs**: Memastikan baseURL tidak hardcoded di spec/page mana pun dan mutlak dibaca dari `env.ts` atau `playwright.config.ts`.
3. **TypeScript & Linter Gates**: Memastikan seluruh kode baru lulus uji compilation dan quality check 100%.

---

### 6.4 Acceptance Checklist

| # | Criteria | Cara Verifikasi |
|---|----------|----------------|
| 1 | Berkas `MIGRATION.md` terbentuk di root repositori | File exists |
| 2 | Berkas `playwright.config.monorepo.ts` terbentuk di root repositori | File exists |
| 3 | MIGRATION menjelaskan 2 skenario (Folder & Monorepo Workspaces) | Visual check pada berkas |
| 4 | MIGRATION menjelaskan petunjuk merge dependencies | Visual check pada berkas |
| 5 | MIGRATION menjelaskan manajemen secrets di GitHub Actions | Visual check pada berkas |
| 6 | Berkas config monorepo memiliki blok `webServer` valid | Visual check pada config |
| 7 | `webServer` disetel untuk recycle local server secara pintar | `reuseExistingServer: !process.env.CI` tertera |
| 8 | Tidak ada absolute local paths yang tertulis di kode | Grep audit lulus |
| 9 | Tidak ada hardcoded target URL di spec files | Grep audit lulus |
| 10 | Seluruh test suite (setup + specs) tetap berjalan sukses | `npm test` exit code 0 |

---

## User Review Required

> [!IMPORTANT]
> Phase 3 di atas sudah di-detail-kan. Key decisions:
> 1. **Auth via Setup Project** — Menggunakan official Playwright `setup` project pattern (bukan custom fixture + manual cache). Chromium project depends on setup, storageState di-share via `.auth/user.json`.
> 2. **BasePage subset 22 methods** — Port dari Python BasePage (670 baris, 35+ methods) dipilih hanya yang essential untuk Phase 4. MUI-specific methods ditambahkan on-demand di phase selanjutnya.
> 3. **`env.ts` typed getter** — Semua credentials diakses via `env.USER_EMAIL` / `env.USER_PASSWORD` (lazy getter pattern). Validation menolak placeholder umum dari `.env.example`.
> 4. **`base.fixture.ts` sebagai "seam"** — Re-export `test` dan `expect` dari `@playwright/test`. Semua spec file import dari sini. Phase 4 tinggal extend tanpa refactor imports.
> 5. **`playwright.config.ts` restructure** — `testDir` global berubah ke `./tests`. Setup project: `./tests/support`, chromium project: `./tests/specs`. Smoke test otomatis depends on auth setup.
> 6. **Tidak ada `waitHelpers.ts`** — Wait utilities sudah ter-cover di `BasePage.ts` methods (`waitForElement`, `waitForElementHidden`, `waitForSpinnerGone`). File terpisah tidak diperlukan.
> 7. **Tidak ada `npm install` baru** — Phase 3 hanya menambahkan TypeScript source files, tidak ada dependency baru.
>
> Silakan approve untuk mulai implementasi Phase 3, atau berikan feedback jika ada yang perlu diubah.


# 🎭 ERPku E2E Test Suite (Playwright + TypeScript)

Standalone Playwright E2E test repository for ERPku application.

## Prerequisites

- Node.js >= 20
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
TEST_USER_EMAIL=email_qa@example.com
TEST_USER_USERNAME=username_qa
TEST_USER_PHONE=081234567890
TEST_USER_PASSWORD=password_rahasia
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

### 5. Running via VS Code Extension (Recommended for Dev)

Proyek ini telah dilengkapi dengan konfigurasi [`.vscode/settings.json`](file:///c:/laragon/www/erpku-testing/erpku-automation-nodejs/.vscode/settings.json) bawaan. Anda dapat menjalankan tes secara visual:
1. Instal ekstensi **Playwright Test for VSCode** (`ms-playwright.playwright`).
2. Buka sidebar **Testing** di VS Code.
3. Klik tombol **Run** (ikon play hijau) di sebelah skenario tes untuk mengeksekusinya secara langsung dari editor.

### 6. View reports

```bash
npx playwright show-report ./reports/html
```

## Project Structure

```
tests/
├── data/           # Static test data files (*.data.json)
│   └── login.data.json
├── fixtures/       # Custom test fixtures (Dependency Injection)
│   └── base.fixture.ts
├── pages/          # Page Object Models (extended from BasePage)
│   ├── BasePage.ts # Induk POM dengan utilitas Dialogs, Tab, Download/Upload
│   ├── DashboardPage.ts
│   └── LoginPage.ts
├── specs/          # Test scenario files (*.spec.ts)
│   ├── auth/       # Authentication tests (DDT-driven)
│   ├── dashboard/  # Dashboard tests
│   └── smoke/      # Smoke tests (@smoke tag)
├── support/        # Global setup/teardown & reused auth state
│   └── auth.setup.ts
└── utils/          # Helper utilities
    └── env.ts      # Type-safe environment variable reader & validator
```

## Environment Variables

| Variable             | Required | Description                           |
| -------------------- | -------- | ------------------------------------- |
| `BASE_URL`           | ✅       | Full URL aplikasi yang akan ditest    |
| `ENV_NAME`           | ❌       | Environment identifier (dev/stg/prod) |
| `TEST_USER_EMAIL`    | ✅       | Email akun QA test                    |
| `TEST_USER_USERNAME` | ✅       | Username akun QA test                 |
| `TEST_USER_PHONE`    | ✅       | Nomor telepon akun QA test            |
| `TEST_USER_PASSWORD` | ✅       | Password akun QA test                 |

## Architecture Notes

- **Path Aliases (`@/*`)**: Seluruh import di dalam `tests/` menggunakan alias `@/` yang merujuk langsung ke direktori `tests/` untuk kebersihan dan kemudahan pemeliharaan kode (dikonfigurasi via `tsconfig.json`).
- **Data-Driven Testing (DDT)**: Skenario tes dirancang berbasis data (DDT) secara dinamis menggunakan berkas data pendukung seperti `login.data.json`.
- **Custom Fixtures**: Menghilangkan instansiasi manual dengan meng-extend test runner Playwright untuk menyuntikkan Page Objects secara otomatis.
- **Robust BasePage**: Dilengkapi utilitas mutakhir untuk menangani Dynamic JS Dialogs, pembukaan tab browser baru, serta pelacakan unggah/unduh file secara mandiri.
- **Global Auth Setup**: Login dijalankan satu kali di awal suite pengujian via `auth.setup.ts` dan disimpan di `.auth/user.json` untuk meningkatkan kecepatan eksekusi tes (hanya 300ms untuk pengecekan sesi berikutnya).

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

Or run smoke tests only (directly, without lint/typecheck):

```bash
npm run test:smoke
```

## Naming Conventions

| Item          | Convention                      | Example                              |
| ------------- | ------------------------------- | ------------------------------------ |
| Test file     | `kebab-case.spec.ts`            | `login.spec.ts`, `dashboard.spec.ts` |
| Page Object   | `PascalCase.ts`                 | `LoginPage.ts`, `DashboardPage.ts`   |
| Fixture file  | `kebab-case.fixture.ts`         | `base.fixture.ts`                    |
| Utility file  | `camelCase.ts`                  | `env.ts`                             |
| Test data     | `kebab-case.data.json`          | `login.data.json`                    |
| Test describe | Nama feature / halaman          | `'Login Page'`, `'Dashboard'`        |
| Test case     | `should ...`                    | `'should display login form'`        |
| Tag           | `@kebab-case` di describe title | `'Smoke Tests @smoke'`               |
| Variable      | `camelCase`                     | `loginButton`, `usernameInput`       |
| Const / enum  | `UPPER_SNAKE` atau `PascalCase` | `BASE_URL`, `UserRole`               |

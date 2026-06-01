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

| Variable             | Required | Description                           |
| -------------------- | -------- | ------------------------------------- |
| `BASE_URL`           | ✅       | Full URL aplikasi yang akan ditest    |
| `ENV_NAME`           | ❌       | Environment identifier (dev/stg/prod) |
| `TEST_USER_EMAIL`    | ✅       | Email akun QA test                    |
| `TEST_USER_PASSWORD` | ✅       | Password akun QA test                 |

## Architecture Notes

- Repo ini **standalone** — tidak ada dependency ke frontend source code.
- Dirancang untuk bisa di-merge ke frontend repo nanti (`/e2e` atau `/packages/e2e-tests`).
- Semua konfigurasi driven by environment variables.
- Menggunakan TypeScript + strict mode untuk type safety.

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
| Fixture file  | `kebab-case.fixture.ts`         | `auth.fixture.ts`                    |
| Utility file  | `camelCase.ts`                  | `waitHelpers.ts`, `env.ts`           |
| Test data     | `kebab-case.json`               | `users.json`, `test-data.json`       |
| Test describe | Nama feature / halaman          | `'Login Page'`, `'Dashboard'`        |
| Test case     | `should ...`                    | `'should display login form'`        |
| Tag           | `@kebab-case` di describe title | `'Smoke Tests @smoke'`               |
| Variable      | `camelCase`                     | `loginButton`, `usernameInput`       |
| Const / enum  | `UPPER_SNAKE` atau `PascalCase` | `BASE_URL`, `UserRole`               |

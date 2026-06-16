# ERPku Example Adapter

Runnable reference implementation for ERPKU on top of the generic template core.

## Contents

| Path                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `support/auth.setup.ts`          | ERPKU auth setup (uses `LoginPage` POM, saves `.auth/user.json`) |
| `fixtures/project.fixture.ts`    | ERPKU POM registration (`loginPage`, `dashboardPage`)            |
| `pages/ui/`                      | Login and dashboard POMs                                         |
| `pages/customers/`               | Customers domain POMs                                            |
| `tests/`                         | Smoke, auth, dashboard, and customers specs                      |
| `mock-data/login.data.json`      | Login failure DDT data                                           |
| `environments/erpku.env.example` | ERPKU-specific auth defaults                                     |
| `playwright.config.ts`           | Runnable Playwright config for this adapter                      |

## Run locally

1. Copy `environments/local.env.example` → `environments/local.env` and fill `BASE_URL` + credentials (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`).
2. Run (adapter config auto-loads ERPKU auth defaults from `environments/erpku.env.example`):

```bash
npm run test:erpku-example              # full suite (smoke + regression)
npm run test:erpku-example -- --project=smoke
npm run test:erpku-example -- --project=chromium
```

## Framework vs adapter

- **`src/`** — generic template (empty `project.fixture.ts`, generic `seed.spec.ts`).
- **`example/erpku/`** — ERPKU-specific pages, fixtures, and tests. CI E2E runs this adapter when secrets are configured.

When forking for a new app, copy this folder as a starting point and replace POMs, env defaults, and tests for your target application.

## Workshop (Path B)

Reference adapter only on alpha:

- Run smoke: `npm run test:erpku-example -- --project=smoke`
- Walkthrough POMs, fixtures, and existing specs under `tests/`
- **AI Generator does not write new specs here** — pipeline output stays in template core `src/tests/` (see [docs/GUIDE.md](../../docs/GUIDE.md))

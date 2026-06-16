# ADR-0002: Generic Multi-Project Framework Over ERPKU-Specific Tool

## Status

Accepted — **implemented** (framework seam via `project.fixture.ts` + runnable `example/erpku/` adapter)

## Context

The framework was initially built alongside the ERPKU application, resulting in application-specific code embedded in core framework files:

- `auth.setup.ts` contained hardcoded ERPKU selectors ("Berhasil Login" text, `/dashboard` endpoint)
- `project.fixture.ts` registered only ERPKU `loginPage` and `dashboardPage`
- The only example requirement is ERPKU-specific
- Environment templates included ERPKU-specific fields (`TEST_USER_PHONE`, `AUTH_*`)

The question: should the framework remain coupled to ERPKU, or should it become a generic toolkit that different QA members use across different projects?

## Decision

The Playwright QA Kit is a **generic, multi-project** framework. Application-specific code (auth flows, POMs, environment configs) must be separated from the framework core. ERPKU lives as a **runnable reference adapter** under `example/erpku/`.

Different QA team members will test different applications using the same framework.

## Implementation (completed)

| Area                                           | Result                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `src/fixtures/project.fixture.ts`              | Empty template seam — forks register POMs here                        |
| `example/erpku/fixtures/project.fixture.ts`    | ERPKU POM registration                                                |
| `src/pages/ui/`                                | Removed — POMs moved to `example/erpku/pages/`                        |
| `src/tests/ui/`                                | Removed — specs moved to `example/erpku/tests/`                       |
| `src/tests/seed.spec.ts`                       | Generic bootstrap (`page.goto(BASE_URL)`)                             |
| `auth.setup.ts`                                | Moved to `example/erpku/support/` — uses `LoginPage` POM              |
| `environments/local.env.example`               | Universal keys only                                                   |
| `example/erpku/environments/erpku.env.example` | ERPKU auth defaults — auto-loaded via env-loader adapter overlay      |
| `src/utils/env-loader.ts`                      | Optional `adapterEnv` overlay after core `environments/{APP_ENV}.env` |
| `example/erpku/playwright.config.ts`           | Runnable adapter config                                               |
| CI `e2e.yml`                                   | Runs `npm run test:erpku-example`                                     |

## Consequences

### Benefits

- QA team members can onboard different projects independently.
- The framework becomes shareable across the IT division without forking.
- Template core (`src/`) stays stable for upstream merge (ADR-0003).

### Risks

- Auth setup requires explicit `AUTH_*` env vars when using the example adapter.
- More documentation needed for "how to adapt for your project" — see `example/erpku/README.md` and `docs/GUIDE.md`.

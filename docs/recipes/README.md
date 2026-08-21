# Playwright Config Recipes

Copy-paste references for post-fork integration scenarios. These files are **not** part of template runtime — they are not included in root `tsconfig.json` and have no npm script.

See [FORK-ONBOARDING.md → Integration into an existing frontend repo](../../FORK-ONBOARDING.md#10-integration-into-an-existing-frontend-repo).

| Recipe                                                                             | Use when                                                                                  |
| --- | --- |
| [`playwright.config.nextjs-e2e.recipe.ts`](playwright.config.nextjs-e2e.recipe.ts) | Integrating the kit into a Next.js app under `/e2e` with auth setup project + `webServer` |
| [`playwright.role-projects.recipe.ts`](playwright.role-projects.recipe.ts)         | Multi-role projects via `buildRoleProjects` + `.auth/<role>.json`                         |
| [`FILE-UPLOAD-DOWNLOAD.md`](FILE-UPLOAD-DOWNLOAD.md)                               | Fixture-first `@upload` / `@download` — no OS picker pause                                |
| [`PDF-EXCEL-CONTENT-ASSERT.md`](PDF-EXCEL-CONTENT-ASSERT.md)                       | `@file-content` PDF text / Excel headers — scenario-owned needles only                    |
| [`NETWORK-ASSERT.md`](NETWORK-ASSERT.md)                                           | `@network-assert` live payload/response — partial contract; `@network` remains mock-only  |
| [`MULTI-SESSION-SYNC.md`](MULTI-SESSION-SYNC.md)                                   | Dual `browser.newContext` admin↔user data sync in one test                                |

Related runtime configs (runnable, not recipes):

- `config/playwright/cross-browser.ts` — chromium/firefox/webkit matrix
- `config/playwright/mobile.ts` — Pixel 5 + iPhone 13 device projects

When copying a recipe to your fork:

1. Copy [`config/playwright/base.ts`](../../config/playwright/base.ts) to your repo root (merge from upstream on framework updates).
2. Copy the recipe to `playwright.config.ts` (or `/e2e/playwright.config.ts`) and adjust `testDir`, paths, and reporters for your layout.
3. Copy [`src/support/custom-reporter.ts`](../../src/support/custom-reporter.ts) to the path referenced in the recipe (default `./e2e/support/custom-reporter.ts`).
4. Call `loadEnvironment()` first, then spread `buildPlaywrightSharedDefaults()` from the copied base config.

Recipes use `createFrameworkReporters()` so forks keep JSON output for the Healer (`get_test_failures`) and MCP `health_check` JSON gate — not just HTML reports.

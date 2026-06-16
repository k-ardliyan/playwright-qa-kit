# Playwright Config Recipes

Copy-paste references for post-fork integration scenarios. These files are **not** part of template runtime — they are not included in root `tsconfig.json` and have no npm script.

See [MIGRATION.md](../MIGRATION.md) and [ADR-0003](../adr/0003-template-fork-deployment-model.md) (Template Fork).

| Recipe                                                                             | Use when                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`playwright.config.nextjs-e2e.recipe.ts`](playwright.config.nextjs-e2e.recipe.ts) | Integrating the kit into a Next.js app under `/e2e` with auth setup project + `webServer` |

When copying a recipe to your fork:

1. Copy [`playwright.config.base.ts`](../../playwright.config.base.ts) to your repo root (merge from upstream on framework updates).
2. Copy the recipe to `playwright.config.ts` (or `/e2e/playwright.config.ts`) and adjust `testDir`, paths, and reporters for your layout.
3. Copy [`src/support/custom-reporter.ts`](../../src/support/custom-reporter.ts) to the path referenced in the recipe (default `./e2e/support/custom-reporter.ts`).
4. Wire `loadEnvironment()` from your env-loader path if needed.

Recipes use `createFrameworkReporters()` so forks keep JSON output for the Healer (`get_test_failures`) and MCP `health_check` JSON gate — not just HTML reports.

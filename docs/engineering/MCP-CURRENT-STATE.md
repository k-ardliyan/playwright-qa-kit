# MCP Integration — Current State Audit

> Generated for tasks **MCP-001** & **MCP-024**.
> Baseline audit of `@playwright/mcp` configuration, versions, entry points, and authentication abstraction.

---

## 1. Resolved Version Sources

Currently, the `@playwright/mcp` version is specified in several disparate places:

| Location            | Configured Version / Specifier             | Role / Context                             |
| --- | --- | --- |
| `.mcp.json`         | `0.0.78` (`npx -y @playwright/mcp@0.0.78`) | Project-level MCP config (source of truth) |
| `.vscode/mcp.json`  | `0.0.78` (`npx -y @playwright/mcp@0.0.78`) | Editor-level MCP compatibility config      |
| `package.json`      | `^0.0.78`                                  | DevDependency                              |
| `package-lock.json` | `0.0.78`                                   | Resolved lockfile version                  |
| `CUSTOM-MCP.md`     | `0.0.78`                                   | Documentation examples                     |
| `.github/AGENTS.md` | `0.0.77`                                   | Legacy documentation reference             |

---

## 2. MCP Launch Entry Points

1. **Official Playwright MCP (`playwright`)**:
   - Launched via `npx tsx tools/scripts/playwright-mcp-launch.ts`
   - Configured directly in `.mcp.json` and `.vscode/mcp.json`.
   - Supports centralized environment and profile bootstrapping.
2. **Playwright Test MCP (`playwright-test`)**:
   - Launched via `npx tsx tools/scripts/playwright-test-mcp-launch.ts`
   - Uses `getPlaywrightConfigPath()` and `bootstrapMcpEnvironment()`.
3. **Custom QA MCP (`playwright-qa`)**:
   - Launched via `node tools/mcp/dist/index-mcp.js`
   - Bootstraps environment via `mcp-env-bootstrap.ts`.

---

## 3. Duplicated Configuration & Gaps

- **Duplication:** `.mcp.json` and `.vscode/mcp.json` maintain redundant argument lists (`["-y", "@playwright/mcp@0.0.78", "--headless"]`).
- **Capability Gaps:** `CUSTOM-MCP.md` documents only `--caps=network`, `--caps=devtools`, and `--caps=vision`. Official Playwright MCP also supports:
  - `storage` (session/cookie isolation and persistence)
  - `testing` (semantic assertions, live locator generation)
  - `pdf` (browser rendered PDF export)
  - `config` (introspection and options)
- **Profile Seam Missing:** No dynamic launcher exists to switch capabilities based on QA intent (`author`, `debug`, `auth`, `visual`, `artifact`, `minimal`).

---

## 4. Current Authentication State Abstraction (MCP-024)

- **Storage Path Helper:** [`src/support/auth-paths.ts`](../../src/support/auth-paths.ts)
  - `authStatePath(role, appEnv)` resolves `.auth/{APP_ENV}/{role}.json` (with local fallback).
  - `authStateWritePath(role, appEnv)` resolves write path.
  - `ensureAuthDirForEnv(appEnv)` creates `.auth/{APP_ENV}/`.
- **Auth Setup:** [`src/support/auth.setup.ts`](../../src/support/auth.setup.ts)
  - Automates browser login per role using credentials from `environments/{APP_ENV}.env`.
  - Saves storage state into `.auth/{APP_ENV}/{role}.json`.
- **Missing in MCP:** The official Playwright MCP does not currently read or initialize with `authStatePath(role)`, leading to non-deterministic session state in live exploration.

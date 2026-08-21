# Playwright MCP Upgrade Pull Request Checklist

> Generated for task **MCP-101**.
> Use this checklist when upgrading `@playwright/mcp` to a new release.

---

## Upgrade Verification Checklist

Before opening or merging a PR that upgrades `@playwright/mcp`:

- [ ] **1. Docs & Release Notes Audit**
  - Review official Playwright MCP release notes and changelog.
  - Check for new, modified, or deprecated tools and capability groups.
- [ ] **2. Capability Manifest Alignment**
  - Update `src/shared/mcp/capability-manifest.ts` if new tools are introduced.
  - Update `PLAYWRIGHT_MCP_BASELINE_VERSION` in `src/shared/mcp/version.ts`.
- [ ] **3. Dependency & Lockfile**
  - Update `package.json` devDependency to the exact new version.
  - Run `npm install` to update `package-lock.json`.
- [ ] **4. Compatibility Smoke Suite**
  - Run `npm run mcp:check` and ensure exit code `0`.
  - Run `npx playwright test src/__tests__/unit/mcp-*.test.ts -c config/playwright/unit.ts`.
- [ ] **5. Session & Auth Determinism Smoke**
  - Verify isolated context launch via `npx tsx tools/scripts/playwright-mcp-launch.ts --profile=author --role=user`.
  - Verify credentials and storage state are not leaked in logs.
- [ ] **6. Live Verification & Locators**
  - Run generator unit tests: `npx playwright test src/__tests__/unit/generator-*.test.ts -c config/playwright/unit.ts`.
  - Ensure static test validation passes: `npm run validate`.
- [ ] **7. Quality Gate**
  - Run full quality suite: `npm run test:quality`.
- [ ] **8. Documentation**
  - Update `CUSTOM-MCP.md` or `AGENTS.md` if tool signatures or user-facing behavior changed.

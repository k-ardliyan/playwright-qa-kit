# Generator Agent

## Role

You convert a Planner scenario table into Playwright TypeScript test files.

## Input Format

Input is the Planner Markdown test plan under `specs/` (hybrid format with Application Overview + per-scenario tables).

Required table columns:

- `Scenario Name`
- `Steps`
- `Expected Result`

Also read per-scenario fields:

- `Test ID` — TC-XXX-NNN from scenario metadata (used for `setTestMetadata`)
- `Priority` — `high` / `medium` / `low` per scenario
- `Input Data` — key: value pairs from requirement (used for `setTestMetadata`)
- `Expected Result` — observable outcome (used for `setTestMetadata`)
- `Layer` — affected layers FE / BE / DB / API (used for `setTestMetadata`)
- `Role` — which role this scenario runs as, or "general"
- `Auth Context` — storage state path (e.g. `.auth/finance.json`) or `unauthenticated`
- `Seed` — always `src/tests/seed.spec.ts`

Also read metadata from the source requirement via `normalize_requirements` when available.

## MCP Dependencies

| Server          | Tool                       | Purpose                                                       |
| --------------- | -------------------------- | ------------------------------------------------------------- |
| `playwright-qa` | `normalize_requirements`   | Read requirement metadata including role scope and auth state |
| `playwright-qa` | `validate_generated_tests` | Validate generated spec files after generation                |
| `playwright-qa` | `snapshot_page`            | Capture ARIA + selector catalog for a specific page           |

### Selector Catalog Reuse (Token-Efficient Locator Discovery)

Before calling `browser_snapshot` for live verification, check `selector-catalog/<featureName>/<pageName>.json`. The MCP `snapshot_page` tool already extracted and prioritised selectors using the Playwright 2026 best-practice order (`getByRole(name, exact)` → `getByLabel` → `getByText` → `getByTestId` → CSS fallback).

**Reuse flow:**

1. **Read the JSON index** at `selector-catalog/<featureName>/<pageName>.json`.
2. For each element in `elements[]`, copy the `primary` expression into the POM method body. If `primary` is `null`, fall back to the first non-CSS candidate in `candidates[]`.
3. **Skip `browser_snapshot` entirely** when the catalog hash matches the live page (no DOM drift).
4. **Only call `browser_snapshot`** when:
   - The catalog file does not exist for the page.
   - The hash in the catalog is older than the current build (DOM drift suspected).
   - The required element is not present in the catalog (e.g. dynamically rendered after interaction).
5. **Never** read the `.aria.yml` file for locator discovery — it is for `toMatchAriaSnapshot()` assertions only and is expensive to parse.

**Selector priority when generating POMs:**

1. `primary` from the catalog (already uniqueness-checked against the live DOM).
2. The first `candidates[]` entry that is not a CSS chain.
3. CSS chain as a last resort — flagged `fragile: true` in the catalog; surface that fragility in the POM JSDoc comment.

## Metadata → Code Mapping

| Source (requirement / test plan)              | Generated code                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `metadata.tags` or `#tags`                    | `test.describe('...', { tag: ['@auth', '@ui'] }, () => {`                                     |
| `metadata.authState: unauthenticated`         | `test.use({ storageState: { cookies: [], origins: [] } })`                                    |
| `metadata.authState: authenticated` (general) | `test.use({ storageState: '.auth/user.json' })`                                               |
| `Role: super-admin`                           | `test.use({ storageState: '.auth/super-admin.json' })`                                        |
| `Role: finance`                               | `test.use({ storageState: '.auth/finance.json' })`                                            |
| `Role: hrd`                                   | `test.use({ storageState: '.auth/hrd.json' })`                                                |
| `Role: admin`                                 | `test.use({ storageState: '.auth/admin.json' })`                                              |
| `Role: user` / `Role: general`                | `test.use({ storageState: '.auth/user.json' })`                                               |
| `Auth Context: unauthenticated`               | `test.use({ storageState: { cookies: [], origins: [] } })`                                    |
| `Auth Context: .auth/<role>.json`             | `test.use({ storageState: '.auth/<role>.json' })`                                             |
| Scenario type `(@access-restriction)`         | Generate test that verifies access is denied: redirect, error message, or element not visible |
| Scenario type `(@failure)`                    | Generate test with invalid input, assert error message / validation state                     |
| Scenario type `(@manual)`                     | `test.skip(true, 'Manual: <reason from Expected Result>')` — never omit the reason            |
| Scenario type `(@success)` or untagged        | Generate full positive-path test                                                              |
| `metadata.pomRequired`                        | Import and use the named POM class(es) from `src/pages/<name>.ts`                             |

## File Naming Convention

| Scenario scope    | File name pattern                    | Example                                                  |
| ----------------- | ------------------------------------ | -------------------------------------------------------- |
| General (no role) | `src/tests/<feature>.spec.ts`        | `src/tests/login-empty-fields.spec.ts`                   |
| Role-specific     | `src/tests/<feature>-<role>.spec.ts` | `src/tests/invoice-finance.spec.ts`                      |
| Multiple roles    | One file per role                    | `invoice-finance.spec.ts`, `invoice-super-admin.spec.ts` |

Never put all role scenarios in a single file — each role gets its own file so they can run independently and report separately.

## Auth Storage State Convention

All auth state files live under `.auth/` in the repo root:

```
.auth/
  user.json          ← default authenticated user
  super-admin.json   ← super admin role
  finance.json       ← finance role
  hrd.json           ← hrd role
  admin.json         ← admin role
```

These files are created by auth setup tests (e.g. `src/tests/auth.setup.ts`). If a role file does not exist yet, generate the test with a comment `// AUTH SETUP REQUIRED: run auth setup for role '<role>' first`.

See `docs/AUTH-CONTEXT-CONVENTION.md` for full convention and setup guide.

## Table View Metadata — Mandatory Annotation Block

Every generated `test()` MUST include a metadata annotation block as the **first statement** in the test body. This feeds the custom reporter's Table View dashboard and export functions.

Import helpers at the top of each spec file:

```typescript
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';
```

### Annotation block pattern

```typescript
test('TC-LOGIN-001: Login berhasil dengan kredensial valid', async ({ page }, testInfo) => {
  // WAJIB: metadata block — baris pertama sebelum langkah apapun
  setTestMetadata({
    testId: 'TC-LOGIN-001', // dari kolom Test ID di test plan
    scenarioId: 'SC-01', // dari SC-XX di judul skenario
    priority: 'high', // dari kolom Priority di test plan
    expectedResult: 'Toast "Berhasil Login" muncul; URL berubah ke /dashboard',
    inputData: { email: 'valid', password: 'valid' }, // opsional, dari Input Data
    role: 'super-admin', // opsional, hanya untuk role-aware spec
    affectedLayer: ['FE'], // opsional, dari kolom Layer di test plan
  });

  // ... langkah-langkah test ...

  // WAJIB: capture actual result setelah semua assertion berhasil (satu kali per test)
  captureActualResult('Toast muncul, URL berubah ke /dashboard confirmed');
});
```

### Rules

1. `setTestMetadata()` dipanggil **satu kali**, sebagai statement pertama di dalam test body.
2. `testId` wajib — ambil dari kolom `Test ID` di test plan.
3. `priority` wajib — ambil dari kolom `Priority` di test plan.
4. `expectedResult` wajib — ambil dari kolom `Expected Result` di test plan.
5. `role` opsional — isi hanya untuk role-aware spec, sesuai role yang dijalankan.
6. `inputData` opsional — isi jika kolom `Input Data` di test plan tidak kosong/`-`.
7. `affectedLayer` opsional — isi jika kolom `Layer` di test plan tidak kosong/`-`.
8. `captureActualResult()` dipanggil **setelah assertion terakhir berhasil** — satu kali per test.
9. Untuk `test.skip` (manual/skeleton): tetap panggil `setTestMetadata()`, skip `captureActualResult()`.
10. Jika test gagal sebelum `captureActualResult()` terpanggil, reporter otomatis pakai error message sebagai actual result.

### Skeleton pattern (tetap wajib annotation block)

```typescript
test.skip('TC-XXX-001: SC-XX: <scenario> — SKELETON: <reason>', async ({ page }, testInfo) => {
  setTestMetadata({
    testId: 'TC-XXX-001',
    scenarioId: 'SC-XX',
    priority: 'medium',
    expectedResult: '<expected result from plan>',
  });
  // SKELETON — not yet implemented
  // Reason: <why>
});
```

When a scenario cannot be generated fully (unclear steps, missing selector catalog, ambiguous expected result, or auth setup not yet available), generate a **skeleton** instead of skipping silently.

Skeleton format:

```typescript
test.skip('SC-XX: <scenario name> — SKELETON: <reason>', async ({ page }) => {
  // SKELETON — not yet implemented
  // Reason: <why this scenario couldn't be generated fully>
  // Required before implementing:
  //   - <item 1, e.g. "auth setup for role 'finance'">
  //   - <item 2, e.g. "selector catalog for /finance/invoices page">
  // Steps from plan:
  //   1. <step 1>
  //   2. <step 2>
  // Expected result: <expected result from plan>
});
```

Mark skeletons with `// SKELETON` so they're easy to find and complete later.

## Code Generation Rules

1. Always import `test` from `@/fixtures/base.fixture`.
2. Use POM fixtures (do not place raw brittle locators in test logic unless strictly necessary).
3. Wrap meaningful actions/assertions inside `test.step()`.
4. Use factory/data helpers from `@/shared/utils/factories` when dynamic data is needed.
5. Include relevant test tags (`@smoke`, `@regression`, `@ui`, `@api`, `@role-<rolename>` for role-specific tests).
6. Use `test.skip` with tag `@manual` for CAPTCHA or flows that cannot be automated safely — always include the reason.
7. For `(@access-restriction)` scenarios, assert the denial explicitly: check redirect URL, visible error message, or absence of restricted element.
8. For role-specific files, always include `test.use({ storageState: '.auth/<role>.json' })` at the describe level.
9. After all scenarios are processed, call `validate_generated_tests` (all specs or per `filePath`).
10. If a scenario is blocked (auth missing, unclear steps), generate skeleton — do not silently skip.

## Output Contract

Return:

- list of generated files,
- scenario-to-file mapping,
- any skipped/unmappable scenarios with reasons,
- any skeleton files generated with the reason,
- scenarios deferred to Healer (with last failure message).

## Example Prompts

- "Generate tests from `specs/example-login-extension-test-plan.md` into `src/tests/login-empty-fields.spec.ts`."
- "Generate role-aware tests from `specs/finance-approve-invoice-test-plan.md` — create one file per role: `src/tests/invoice-finance.spec.ts` and `src/tests/invoice-super-admin.spec.ts`."
- "Generate access-restriction test from SC-03 in `specs/finance-approve-invoice-test-plan.md` for role hrd."

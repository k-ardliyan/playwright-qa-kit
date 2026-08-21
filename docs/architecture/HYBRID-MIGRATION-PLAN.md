# Playwright QA Kit — Hybrid Architecture Migration Plan

> **Status:** Implementation Planning / Architecture Migration  
> **Target:** `k-ardliyan/playwright-qa-kit`  
> **Architecture:** Hybrid Architecture — Playwright-native boundary + QA Kit internals  
> **Primary users:** QA via Hermes Chat Desktop, QA Automation, framework maintainers, AI coding harnesses  
> **Out of scope:** Prompt Studio and any Prompt Studio-related implementation  
> **Planning date:** 2026-08-20

---

# 0. Purpose

Dokumen ini adalah **execution-grade migration plan** untuk merapikan arsitektur repository Playwright QA Kit menuju model hybrid yang:

1. tetap selaras dengan convention resmi Playwright,
2. lebih mudah dipelajari QA,
3. lebih aman digunakan melalui Hermes / AI harness,
4. memiliki ownership boundary yang eksplisit,
5. memisahkan Playwright test workspace dari framework engine,
6. mengelompokkan tooling/config/output agar root tidak membingungkan,
7. mengurangi hardcoded path dan architecture drift,
8. tidak mengubah behavior produk tanpa kebutuhan,
9. dapat dimigrasikan secara bertahap dengan regression gate yang jelas.

Dokumen ini **bukan sekadar daftar `git mv`**.

Harness yang menjalankan migration WAJIB memperlakukan pekerjaan ini sebagai perubahan kontrak lintas:

- Playwright config,
- TypeScript imports,
- AI agent instructions,
- custom MCP,
- runner,
- reporter,
- dashboard,
- validators,
- environment tooling,
- setup wizard,
- auth setup,
- fixtures,
- POM,
- sample data,
- docs,
- examples,
- CI,
- npm scripts,
- gitignore,
- coverage mapping,
- archive/report history,
- tests.

---

# 1. Architectural Decision

## 1.1 Final Golden Path

QA harus dapat memahami framework melalui empat konsep saja:

```text
REQUIREMENT
requirements/
      ↓
PLAN
specs/
      ↓
TEST
tests/
      ↓
RESULT
artifacts/
```

Vocabulary resmi seluruh framework:

| Concept     | Canonical Directory |
| ----------- | ------------------- |
| Requirement | `requirements/`     |
| Plan        | `specs/`            |
| Test        | `tests/`            |
| Result      | `artifacts/`        |

Vocabulary ini harus konsisten di:

- README,
- AGENTS.md,
- Hermes response,
- CLI output,
- MCP output,
- docs,
- architecture map,
- dashboard links,
- validation errors.

Jangan menggunakan istilah berbeda untuk objek yang sama jika tidak diperlukan.

Contoh istilah yang harus dinormalisasi:

```text
spec / test plan / planner result
```

Gunakan:

```text
Plan (`specs/`)
```

---

# 2. Alignment with Official Playwright

Target architecture mempertahankan convention yang dekat dengan dokumentasi Playwright:

```text
playwright.config.ts
specs/
tests/
tests/seed.spec.ts
tests/auth.setup.ts
```

Alasan utama:

- Playwright default scaffold menggunakan `tests/`.
- Playwright Test Agents Planner menggunakan seed test dan menghasilkan test plan.
- Playwright Test Agents Generator menghasilkan Playwright Test files.
- Playwright documentation menggunakan setup project dan `tests/auth.setup.ts` sebagai pola auth yang direkomendasikan.
- `testDir` configurable sehingga `tests/` menjadi canonical test boundary tanpa melanggar Playwright.
- custom fixtures tetap merupakan pattern resmi Playwright.

Reference baseline:

- https://playwright.dev/docs/intro
- https://playwright.dev/docs/test-agents
- https://playwright.dev/docs/auth
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/test-projects
- https://playwright.dev/docs/api/class-testconfig

---

# 3. Current Repository Baseline

Pada saat planning ini dibuat, root repository memiliki domain utama:

```text
.github/
.husky/
.vscode/
docs/
environments/
example/erpku/
mcp-server/
requirements/
scripts/
specs/
src/
test-fixtures/

AGENTS.md
ARCHITECTURE.md
CHANGELOG.md
CONTEXT.md
CUSTOM-MCP.md
MAINTENANCE.md
README.md

eslint.config.mjs
package.json
package-lock.json
playwright.config.base.ts
playwright.config.ts
playwright.cross-browser.config.ts
playwright.mobile.config.ts
playwright.unit.config.ts
setup-check.ts
tsconfig.json
validate-generated-tests.ts
validate-requirement.ts
```

Current execution path:

```text
requirements/
      ↓
specs/
      ↓
src/tests/
      ↓
test-results/
reports/
blob-report/
selector-catalog/
```

Current primary Playwright config includes:

```text
testDir: ./src/tests
setup testDir: ./src/support
auth setup: src/support/auth.setup.ts
JSON output: test-results/results.json
HTML output: reports/html
blob output: blob-report
outputDir: test-results
```

Current `src/` includes mixed ownership:

```text
src/
├── agents/
├── cli/
├── executor/
├── fixtures/
├── observability/
├── pages/
├── setup/
├── shared/
├── support/
├── tests/
└── utils/
```

Masalah utama:

- executable tests bercampur dengan framework internals,
- POM bercampur dengan framework internals,
- fixture adapter dan fixture engine tidak mempunyai boundary publik,
- auth setup berada di internal support,
- output runtime tersebar,
- developer tooling berada di root,
- QA-facing area dan maintainer area terlihat setara,
- banyak path merupakan literal string lintas code/docs/scripts,
- AI healer belum mempunyai filesystem ownership boundary yang cukup keras.

---

# 4. Target Repository Architecture

```text
playwright-qa-kit/
│
│   ─────────────────────────────────────────────
│   QA + PLAYWRIGHT GOLDEN PATH
│   ─────────────────────────────────────────────
│
├── requirements/                    # QA input
│   ├── _TEMPLATE.md
│   ├── auth/
│   └── ...
│
├── specs/                           # Planner output / QA review
│   ├── auth/
│   └── ...
│
├── tests/                           # Playwright workspace
│   ├── seed.spec.ts
│   ├── auth.setup.ts
│   ├── fixtures.ts
│   ├── pages/
│   ├── data/
│   ├── helpers/
│   ├── demo/
│   ├── <module>/
│   └── ...
│
│   ─────────────────────────────────────────────
│   QA KIT ENGINE
│   ─────────────────────────────────────────────
│
├── src/                             # framework implementation
│   ├── public/
│   ├── agents/
│   ├── cli/
│   ├── executor/
│   ├── observability/
│   ├── setup/
│   ├── shared/
│   ├── support/
│   └── utils/
│
│   ─────────────────────────────────────────────
│   MAINTAINER TOOLING
│   ─────────────────────────────────────────────
│
├── tools/
│   ├── mcp/
│   ├── scripts/
│   └── validators/
│
│   ─────────────────────────────────────────────
│   CONFIGURATION
│   ─────────────────────────────────────────────
│
├── config/
│   ├── environments/
│   ├── playwright/
│   │   ├── base.ts
│   │   ├── cross-browser.ts
│   │   ├── mobile.ts
│   │   └── unit.ts
│   └── qa-kit.workspace.json
│
│   ─────────────────────────────────────────────
│   GENERATED OUTPUT
│   ─────────────────────────────────────────────
│
├── artifacts/
│   ├── test-results/
│   ├── reports/
│   ├── blob-report/
│   └── selector-catalog/
│
│   ─────────────────────────────────────────────
│   KNOWLEDGE / EXAMPLES
│   ─────────────────────────────────────────────
│
├── docs/
│   ├── qa/
│   ├── automation/
│   ├── framework/
│   ├── architecture/
│   ├── engineering/
│   ├── recipes/
│   └── reference/
│
├── examples/
│   └── erpku/
│
├── .github/
│   ├── agents/
│   ├── workflows/
│   └── AGENTS.md
│
├── .husky/
├── .vscode/
│
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

# 5. Deliberate Non-Changes

Migration harness **MUST NOT** opportunistically refactor unrelated behavior.

Do not change in this phase:

- requirement schema,
- scenario tags,
- role semantics,
- access expectation semantics,
- pipeline phases,
- maximum healer retry semantics,
- failure-source taxonomy unless required for filesystem boundary,
- auth credential format,
- `.auth/{APP_ENV}/<role>.json` storage convention,
- OTP/CAPTCHA behavior,
- environment selector semantics (`APP_ENV` remains canonical),
- dashboard business UX,
- report schema semantics,
- existing MCP tool names,
- Playwright MCP capability policy,
- public CLI command names,
- `npm run qa:run` user-facing behavior,
- test naming convention except path root,
- archive business semantics,
- requirement coverage semantics.

If a move exposes an unrelated defect:

1. record it,
2. classify it,
3. fix only if it blocks migration,
4. otherwise create follow-up note/task.

---

# 6. Explicit Out of Scope

DO NOT create, modify, plan implementation, scaffold, or deploy:

```text
Prompt Studio
prompt-studio/
prompt-library/
GitHub Pages Prompt UI
Prompt Composer
```

Prompt Studio is a future phase after architecture migration is stable.

If a Prompt Studio-related file already exists when migration runs:

- do not expand it,
- do not use it as a reason to change architecture,
- only adjust a path if absolutely required by existing repository references.

---

# 7. Ownership Model

## 7.1 QA-owned

```text
requirements/**
```

QA may:

- create,
- edit,
- delete,
- reorganize feature requirements.

Hermes may assist.

---

## 7.2 QA-reviewable / automation source

```text
specs/**
tests/**
```

`specs/`:

- generally generated by Planner,
- QA reviews and may correct business intent.

`tests/`:

- generated or edited by Generator/Healer/QA Automation,
- committed source,
- NOT disposable generated output.

---

## 7.3 Generated runtime artifacts

```text
artifacts/**
```

Rules:

- system-generated,
- inspectable,
- safe to clean/regenerate according to retention rules,
- never treated as source-of-truth for business intent,
- should not be manually modified to affect test behavior.

---

## 7.4 Protected internal areas

Default protected:

```text
src/**
tools/**
config/**
.github/agents/**
```

Normal pipeline may read these.

Normal Healer must not modify them merely to make a test green.

Modification requires:

- explicit framework maintenance task, OR
- confirmed framework-level defect and user scope permitting framework changes.

---

# 8. Hermes / AI Agent Filesystem Policy

Add a canonical section to `AGENTS.md`:

```markdown
## Repository Ownership Boundaries

### QA-owned

- requirements/**

### Planner / QA review

- specs/**

### Playwright automation source

- tests/**

### Runtime output

- artifacts/**

### Protected framework internals

- src/**
- tools/**
- config/**
- .github/agents/**

Normal Plan/Generate/Execute/Heal/Report work must not modify protected
framework internals unless the task is explicitly a framework-maintenance
task or the root cause has been confirmed as framework-level and the user
has authorized that scope.
```

Add rule:

```text
Do not edit protected areas as a shortcut to make a failing test pass.
```

---

# 9. Healing Escalation Boundary

Canonical repair search order:

```text
1. tests/<feature>.spec.ts
2. tests/pages/**
3. tests/fixtures.ts / tests/helpers/**
4. requirement ambiguity check
5. application behavior classification
6. environment classification
7. framework defect classification
8. STOP before src/tools/config unless framework scope is authorized
```

When framework modification is not authorized:

```text
Result:
frameworkChangeRequired: true
```

Do not silently patch internal implementation.

---

# 10. Path Migration Matrix

## 10.1 Stable Paths

No move:

| Current                | Target                 |
| ---------------------- | ---------------------- |
| `requirements/`        | `requirements/`        |
| `specs/`               | `specs/`               |
| `src/` engine code     | `src/`                 |
| `.github/agents/`      | `.github/agents/`      |
| `README.md`            | `README.md`            |
| `AGENTS.md`            | `AGENTS.md`            |
| `ARCHITECTURE.md`      | `ARCHITECTURE.md`      |
| `CHANGELOG.md`         | `CHANGELOG.md`         |
| `playwright.config.ts` | `playwright.config.ts` |
| `package.json`         | `package.json`         |
| `tsconfig.json`        | `tsconfig.json`        |

---

## 10.2 Playwright Workspace

| Current                              | Target                | Notes                                   |
| ------------------------------------ | --------------------- | --------------------------------------- |
| `src/tests/seed.spec.ts`             | `tests/seed.spec.ts`  | preserve agent seed behavior            |
| `src/tests/demo/**`                  | `tests/demo/**`       | preserve demo project                   |
| generated `src/tests/*.spec.ts`      | `tests/**/*.spec.ts`  | first-class automation source           |
| product test specs in `src/tests/**` | `tests/**`            | preserve relative feature structure     |
| `src/pages/**` project-facing POM    | `tests/pages/**`      | classify before moving                  |
| `test-fixtures/**`                   | `tests/data/**`       | data files, not Playwright fixture code |
| `src/support/auth.setup.ts`          | `tests/auth.setup.ts` | thin Playwright-facing entrypoint       |
| public fixture usage                 | `tests/fixtures.ts`   | stable test adapter                     |

---

## 10.3 Internal Fixtures

Current:

```text
src/fixtures/
├── framework.fixture.ts
├── base.fixture.ts
└── project.fixture.ts
```

Do NOT blindly move all three.

Harness must classify them:

### framework-owned fixture behavior

Keep internal implementation under `src/`.

Target candidate:

```text
src/public/fixtures/
src/support/fixtures/
```

or retain existing implementation while introducing a stable export.

### project-facing fixture adapter

Expose only through:

```text
tests/fixtures.ts
```

Generated specs should not need to understand the full internal fixture chain.

Target import:

```ts
import { test, expect } from '../fixtures';
```

or suitable relative path.

Do not require new tests to import:

```ts
@/fixtures/base.fixture
```

as a long-term public contract.

---

## 10.4 Auth Setup

Current:

```text
src/support/auth.setup.ts
```

Target:

```text
tests/auth.setup.ts
```

But `tests/auth.setup.ts` should be an **entrypoint**, not a dumping ground for auth engine logic.

Preferred:

```text
tests/auth.setup.ts
        ↓
src/public/auth
        ↓
src/support / src/auth implementation
```

Do not change:

```text
.auth/{APP_ENV}/<role>.json
```

in this phase.

---

## 10.5 Tooling

| Current                       | Target                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `mcp-server/`                 | `tools/mcp/`                                                             |
| `scripts/**`                  | `tools/scripts/**`                                                       |
| `setup-check.ts`              | `tools/validators/setup-check.ts` or canonical setup validation location |
| `validate-generated-tests.ts` | `tools/validators/generated-tests.ts`                                    |
| `validate-requirement.ts`     | `tools/validators/requirement.ts`                                        |

Important:

`mcp-server/` currently has its own:

```text
package.json
package-lock.json
tsconfig.json
src/
```

Preserve it as a nested package after move:

```text
tools/mcp/
├── package.json
├── package-lock.json
├── tsconfig.json
└── src/
```

No workspace conversion is required in this migration.

---

## 10.6 Environment Config

| Current         | Target                 |
| --------------- | ---------------------- |
| `environments/` | `config/environments/` |

Preserve filenames such as:

```text
local.env.example
dev.env.example
staging.env.example
production.env.example
```

Update:

- setup wizard,
- env-loader,
- env edit/status/use commands,
- docs,
- `.gitignore`,
- health checks,
- sample setup commands.

---

## 10.7 Playwright Config

Keep:

```text
playwright.config.ts
```

at root.

Move:

| Current                              | Target                               |
| ------------------------------------ | ------------------------------------ |
| `playwright.config.base.ts`          | `config/playwright/base.ts`          |
| `playwright.cross-browser.config.ts` | `config/playwright/cross-browser.ts` |
| `playwright.mobile.config.ts`        | `config/playwright/mobile.ts`        |
| `playwright.unit.config.ts`          | `config/playwright/unit.ts`          |

User-facing npm commands must remain stable where practical.

Example:

```text
npm run test:unit
```

still works even if config moves.

---

# 11. Runtime Output Consolidation

Target:

```text
artifacts/
├── test-results/
├── reports/
├── blob-report/
└── selector-catalog/
```

Map:

| Current logical output | Target                          |
| ---------------------- | ------------------------------- |
| `test-results/**`      | `artifacts/test-results/**`     |
| `reports/**`           | `artifacts/reports/**`          |
| `blob-report/**`       | `artifacts/blob-report/**`      |
| `selector-catalog/**`  | `artifacts/selector-catalog/**` |

Do not create unnecessary parallel directories for:

```text
traces/
screenshots/
videos/
```

if Playwright already nests them under `outputDir`.

Prefer:

```text
artifacts/test-results/
```

as canonical Playwright execution evidence root.

---

# 12. Examples

Move:

```text
example/erpku/
```

to:

```text
examples/erpku/
```

Update alias:

```json
"@erpku/*": ["./examples/erpku/*"]
```

Update:

- tsconfig include,
- docs,
- config imports,
- recipe references,
- generated file references,
- CI if applicable.

---

# 13. Documentation Root Cleanup

Keep at root:

```text
README.md
AGENTS.md
ARCHITECTURE.md
CHANGELOG.md
```

Evaluate moving:

```text
CONTEXT.md
CUSTOM-MCP.md
MAINTENANCE.md
```

Recommended targets:

```text
docs/reference/CONTEXT.md
docs/framework/MCP.md
docs/framework/MAINTENANCE.md
```

If many external docs link to old names, use one migration PR that updates all links atomically.

Do not leave duplicate canonical documentation indefinitely.

---

# 14. Target Root Simplicity

Desired visible domain directories:

```text
requirements/
specs/
tests/

src/
tools/
config/

artifacts/
docs/
examples/
```

Standard hidden/system directories remain:

```text
.github/
.husky/
.vscode/
```

Goal:

> root should communicate architecture, not implementation history.

---

# 15. Workspace Manifest

Create:

```text
config/qa-kit.workspace.json
```

Initial schema:

```json
{
  "schemaVersion": 1,
  "paths": {
    "requirements": "requirements",
    "specs": "specs",
    "tests": "tests",
    "testData": "tests/data",
    "artifacts": "artifacts",
    "reports": "artifacts/reports",
    "testResults": "artifacts/test-results",
    "selectorCatalog": "artifacts/selector-catalog",
    "blobReport": "artifacts/blob-report",
    "environments": "config/environments"
  },
  "ownership": {
    "qa": ["requirements/**"],
    "review": ["specs/**", "tests/**"],
    "generated": ["artifacts/**"],
    "protected": ["src/**", "tools/**", "config/**", ".github/agents/**"]
  }
}
```

---

# 16. Workspace Manifest Rules

Manifest is:

- canonical path registry,
- read by framework code where useful,
- useful for architecture validation,
- useful for agents/tools,
- NOT a user-facing arbitrary folder configuration feature.

Do NOT promise that changing:

```json
"tests": "whatever"
```

will automatically support arbitrary layouts.

The manifest exists to centralize current contract, not to create an infinitely configurable framework.

---

# 17. Typed Workspace Path Registry

Create a TypeScript abstraction, e.g.:

```text
src/public/workspace.ts
```

or:

```text
src/shared/workspace-paths.ts
```

Requirements:

- resolve repository root safely,
- read/validate workspace manifest,
- expose typed path getters,
- no duplicate path literal knowledge in consumers.

Conceptual API:

```ts
workspace.requirementsDir;
workspace.specsDir;
workspace.testsDir;
workspace.testDataDir;
workspace.artifactsDir;
workspace.reportsDir;
workspace.testResultsDir;
workspace.selectorCatalogDir;
workspace.environmentsDir;
```

Avoid:

```ts
path.join(root, 'src/tests');
path.join(root, 'reports');
```

scattered throughout the repository.

---

# 18. Public Test API Boundary

Generated tests must depend on a stable contract.

Create or formalize:

```text
src/public/
```

Possible contents:

```text
src/public/
├── index.ts
├── fixtures.ts
├── auth.ts
├── metadata.ts
├── assertions.ts
└── workspace.ts
```

This does NOT require moving all existing internals immediately.

It can re-export stable behavior.

---

# 19. Test Adapter

Create:

```text
tests/fixtures.ts
```

Purpose:

- canonical import point for generated tests,
- hide internal framework fixture layout,
- allow future internal refactor without mass generated-test rewrite.

Concept:

```ts
export { test, expect, authStatePath, setTestMetadata } from '../src/public';
```

Actual exports must follow current framework capability.

Do not expose every internal helper.

Only stable test-facing API.

---

# 20. Import Boundary Rules

Target rule:

### tests may import

```text
tests/**
src/public/**
```

### tests should not directly import

```text
src/agents/**
src/cli/**
src/executor/**
src/observability/**
src/setup/**
src/shared/internal implementation
src/support/internal implementation
src/utils/internal implementation
tools/**
```

Exceptions require explicit architecture decision.

---

# 21. Import Migration Strategy

Do NOT perform blind regex import replacement.

For every import category:

1. identify current public need,
2. add export to `src/public` if stable,
3. add `tests/fixtures.ts` adapter if appropriate,
4. change generated/product tests,
5. typecheck,
6. run targeted tests.

Special current patterns likely include:

```ts
@/fixtures/base.fixture
@/support/auth-paths
@/support/pw
@/shared/types
```

Classify each:

- test-facing stable API,
- internal-only,
- maintenance-only.

Only test-facing APIs should become public.

---

# 22. POM Boundary

Current:

```text
src/pages/
```

contains at least:

```text
BasePage.ts
LoginForm.ts
```

Migration rule:

### project/application POM

Move to:

```text
tests/pages/
```

### generic framework POM abstraction

If a class is genuinely reusable engine infrastructure:

- keep internal,
- rename/reorganize only if necessary,
- expose through public API only if needed.

Do not assume every file under `src/pages/` belongs to tests without inspection.

---

# 23. Test Data Boundary

Move:

```text
test-fixtures/
```

to:

```text
tests/data/
```

Reason:

Playwright “fixture” is a code concept; the existing folder stores committed sample files.

Preserve structure:

```text
tests/data/
├── browser-intent/
├── excel/
├── images/
├── invalid/
├── network/contracts/demo/
└── pdf/
```

Update helper:

```text
fixturePath(...)
```

to resolve from `workspace.testDataDir`.

Avoid literal:

```text
test-fixtures/
```

inside helper consumers.

---

# 24. Seed Test Contract

Move:

```text
src/tests/seed.spec.ts
```

to:

```text
tests/seed.spec.ts
```

Seed test responsibilities:

- remain minimal,
- use canonical fixture adapter,
- demonstrate recommended import style,
- execute enough initialization for Planner,
- avoid business-specific assertions unless intentionally part of seed semantics.

Update Planner agent context/path.

---

# 25. Auth Setup Contract

Create:

```text
tests/auth.setup.ts
```

Update Playwright config setup project:

```text
testDir: './tests'
testMatch: /auth\.setup\.ts/
```

or equivalent safe pattern.

Ensure normal test project ignores `.setup.ts` as needed.

Do not accidentally run auth setup as product test.

---

# 26. Playwright Main Config Target

Conceptual final:

```ts
export default defineConfig({
  ...buildPlaywrightSharedDefaults(),

  testDir: './tests',

  reporter: createFrameworkReporters({
    jsonOutput: 'artifacts/test-results/results.json',
    htmlFolder: './artifacts/reports/html',
    customReporterPath: './src/support/custom-reporter.ts',
    blobOutputDir: 'artifacts/blob-report',
  }),

  projects: [
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
      fullyParallel: false,
    },
    {
      name: 'chromium',
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/demo/**', '**/*.setup.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'demo',
      testDir: './tests/demo',
      testMatch: '**/*.spec.ts',
    },
  ],

  outputDir: './artifacts/test-results',
});
```

Exact implementation must preserve existing behavior.

---

# 27. Config Import Migration

Root:

```text
playwright.config.ts
```

should import:

```text
./config/playwright/base
```

instead of:

```text
./playwright.config.base
```

Other configs must update their relative imports.

Validate:

- mobile,
- cross-browser,
- unit,
- examples,
- recipes,
- docs.

---

# 28. TypeScript Config Migration

Update `tsconfig.json`.

Current include does not include root `tests/**` because tests live under `src`.

Target include must explicitly cover:

```json
[
  "playwright.config.ts",
  "config/**/*.ts",
  "src/**/*.ts",
  "src/**/*.tsx",
  "tests/**/*.ts",
  "tests/**/*.tsx",
  "tools/**/*.ts",
  "examples/**/*.ts",
  "examples/**/*.tsx"
]
```

Do not include generated artifact TypeScript.

Update alias:

```json
"@erpku/*": ["./examples/erpku/*"]
```

Decide alias strategy for tests.

Prefer avoiding an excessive alias vocabulary.

---

# 29. ESLint / Prettier / Lint-staged

Review configs for:

- path ignores,
- test glob assumptions,
- fixture glob assumptions,
- output ignores,
- mcp nested package,
- artifact directories.

Ensure:

```text
artifacts/**
```

does not cause expensive lint/format scans.

---

# 30. `.gitignore`

Audit and update:

```text
artifacts/
```

Subpath retention rules may differ.

If reports/history are intentionally committed, do NOT blindly ignore the entire artifacts tree.

Classify:

```text
artifacts/reports/archive/
```

if archive is durable data.

Make explicit decision:

### Option A

All runtime report archives remain untracked.

### Option B

Selected report fixtures/examples are moved to test fixtures/docs examples.

Never commit live credentials or auth state.

Keep `.auth/` ignored.

---

# 31. NPM Script Compatibility Principle

User-facing command names should remain stable.

Examples:

```text
npm test
npm run test:smoke
npm run test:unit
npm run qa:run
npm run auth:setup
npm run setup:wizard
npm run setup:check
npm run health:check
npm run mcp:build
npm run mcp:typecheck
npm run validate
npm run validate:requirement
```

Internal implementation path may change.

---

# 32. Package Script Migration Map

Examples:

```text
tsx validate-generated-tests.ts
→ tsx tools/validators/generated-tests.ts
```

```text
tsx validate-requirement.ts
→ tsx tools/validators/requirement.ts
```

```text
tsx scripts/qa-run.ts
→ tsx tools/scripts/qa-run.ts
```

```text
npm ci --prefix mcp-server
→ npm ci --prefix tools/mcp
```

```text
npx tsc -p mcp-server/tsconfig.json
→ npx tsc -p tools/mcp/tsconfig.json
```

```text
cd mcp-server
→ cd tools/mcp
```

```text
npx playwright test src/support/auth.setup.ts ...
→ npx playwright test tests/auth.setup.ts ...
```

```text
-c playwright.unit.config.ts
→ -c config/playwright/unit.ts
```

Maintain script behavior and exit codes.

---

# 33. Tool Script Migration

Move all current `scripts/**` to:

```text
tools/scripts/**
```

Current examples include:

- env-edit,
- env-status,
- env-use,
- health-check-cli,
- manual-check,
- mcp-bootstrap,
- playwright-test-mcp-launch,
- qa-run,
- qa-run-prompt,
- property runner,
- setup helpers,
- file sync helpers.

Update any sibling imports after move.

---

# 34. Tool Tests

Current:

```text
scripts/__tests__/**
```

Target:

```text
tools/scripts/__tests__/**
```

Do not move tool unit tests to product Playwright `tests/`.

They test framework tooling, not target application E2E behavior.

---

# 35. `src/tests/unit` and `src/tests/property`

Important classification step.

Current `src/tests/` contains:

```text
demo/
property/
unit/
seed.spec.ts
```

Not all should become product E2E tests automatically.

Recommended:

### `seed.spec.ts`

→ `tests/seed.spec.ts`

### `demo/`

→ `tests/demo/`

### framework unit tests

Keep near framework code or move to:

```text
src/**/__tests__/
```

### property tests

Keep framework/property test infrastructure separate from product Playwright suite.

Candidate:

```text
src/**/__tests__/
tools/**/__tests__/
```

Do not dump all unit/property tests into root `tests/` if that causes Playwright discovery confusion.

Before moving, classify every file.

---

# 36. Test Discovery Invariant

After migration:

```bash
npx playwright test --list
```

must list:

- intended E2E/product tests,
- demo only under demo project where expected,
- setup only in setup project as appropriate.

It must NOT accidentally discover:

- framework unit tests,
- property tests,
- validator tests,
- MCP tests,
- tool tests.

---

# 37. MCP Package Migration

Move nested package atomically:

```text
mcp-server/
→ tools/mcp/
```

Update:

- root package scripts,
- `.mcp.json`,
- generated MCP config tooling,
- Hermes connector config generation,
- path resolution inside bootstrap scripts,
- README,
- CUSTOM MCP docs,
- tests,
- CI,
- any Windows command templates,
- any hardcoded `mcp-server/dist` references.

---

# 38. MCP Tool Contract Preservation

Do not rename tools during directory refactor.

All existing names must remain stable.

Examples include categories such as:

- health,
- requirement validation,
- normalization,
- parsing,
- generated test validation,
- test failure retrieval,
- test summary,
- artifact listing,
- coverage.

Behavior may only change where path output changes.

---

# 39. MCP Path Output Migration

Any MCP result returning:

```text
src/tests/...
reports/...
test-results/...
selector-catalog/...
test-fixtures/...
```

must return canonical new paths.

Add tests for returned path strings.

---

# 40. Coverage Mapping Migration

Current coverage lifecycle maps:

```text
requirement
→ plan
→ generated test
→ latest result
```

Update test location from:

```text
src/tests/
```

to:

```text
tests/
```

Update report/result roots to `artifacts`.

Coverage behavior must remain identical.

---

# 41. Artifact Listing Migration

`list_artifacts` and similar commands must recognize:

```text
artifacts/**
```

No fallback to old paths after final migration unless temporary compatibility window is deliberately implemented.

---

# 42. Compatibility Bridge Strategy

Because this is a repo-internal alpha framework, avoid maintaining permanent duplicate path support.

Recommended strategy:

## Stage A

Introduce path registry while existing paths still work.

## Stage B

Update consumers to path registry.

## Stage C

Move files/directories.

## Stage D

Run migration validation.

## Stage E

Remove legacy path support.

This provides safer refactoring without long-term dual-layout complexity.

---

# 43. No Permanent Dual Layout

Do not leave:

```text
src/tests/
tests/
```

both active.

Do not leave:

```text
mcp-server/
tools/mcp/
```

both active.

Do not leave:

```text
scripts/
tools/scripts/
```

both active.

Do not leave:

```text
environments/
config/environments/
```

both active.

Temporary bridge is allowed only inside one migration branch/PR sequence.

Final architecture must have one canonical location.

---

# 44. Agent Contract Audit

Audit all:

```text
AGENTS.md
.github/AGENTS.md
.github/agents/*.agent.md
```

Search for:

```text
src/tests
src/pages
src/fixtures
src/support/auth.setup.ts
test-fixtures
reports/
test-results/
selector-catalog/
mcp-server
scripts/
environments/
example/erpku
playwright.*.config.ts
```

Update carefully.

Do not mass-replace semantics.

---

# 45. Planner Agent Requirements

Planner should:

- continue output to `specs/`,
- use `tests/seed.spec.ts`,
- treat `requirements/` as QA Kit structured input,
- not write test code into `src/`,
- understand ownership boundaries.

---

# 46. Generator Agent Requirements

Generator should:

- generate into `tests/`,
- import canonical test adapter,
- use `tests/pages/` for application POM,
- use `tests/data/` for sample files,
- never create new product specs under `src/tests`,
- never import protected internals directly unless public API does not yet exist and migration task explicitly permits it.

Add hard rule:

```text
Generated test files MUST live under tests/.
```

---

# 47. Healer Agent Requirements

Healer must implement repair scope order.

Normal allowed:

```text
tests/**
```

Normal protected:

```text
src/**
tools/**
config/**
.github/agents/**
```

When framework defect suspected:

- report evidence,
- mark framework change required,
- stop unless authorized.

---

# 48. Reporter Agent Requirements

Reporter must:

- read from `artifacts/test-results`,
- write report assets under `artifacts/reports`,
- archive according to canonical report root,
- return canonical paths.

No stale legacy paths.

---

# 49. Orchestrator AGENTS.md

Update:

- architecture quick reference,
- input/output paths,
- pipeline state path,
- test naming,
- report path,
- artifact path,
- MCP path references,
- protected ownership contract,
- generated test validation path.

Keep token budget/on-demand agent loading rules.

---

# 50. Setup Wizard

Audit `src/setup/**`.

Wizard must generate/use:

```text
requirements/
config/environments/
tests/auth.setup.ts
tools/mcp/
```

where relevant.

Wizard result messaging must reflect new architecture.

---

# 51. Setup Check

Move root `setup-check.ts` if still used separately.

Ensure checks verify:

- `tests/` exists,
- auth setup path,
- environment path,
- MCP build path,
- artifact writable paths,
- workspace manifest valid.

---

# 52. Environment Loader

Update default search root from:

```text
environments/
```

to:

```text
config/environments/
```

Preserve:

```text
APP_ENV
```

semantics.

Do not introduce `NODE_ENV` switching.

---

# 53. Environment CLI

Commands:

```text
env:edit
env:status
env:use
```

must continue working.

Update all path references.

Add regression tests for at least:

- local,
- staging,
- invalid env,
- missing env file.

---

# 54. Custom Reporter

Reporter location may remain internal:

```text
src/support/custom-reporter.ts
```

No need to move merely for aesthetics.

Only update output destinations.

Do not refactor reporter architecture in same migration unless required.

---

# 55. Dashboard

Dashboard server/renderers must use canonical report paths.

Audit:

```text
src/cli/dashboard-server.ts
src/support/custom-dashboard/**
```

Update:

- report index root,
- history/archive path,
- compare path,
- run detail links,
- static asset lookup if path-dependent.

Do not redesign dashboard UI.

---

# 56. Archive Commands

Current:

```text
archive:save
archive:view
archive:delete
archive:compare
```

Preserve command names.

Migrate archive storage under:

```text
artifacts/reports/
```

or suitable nested canonical path.

Add archive regression tests.

---

# 57. Evidence / Trace Systems

Audit:

```text
src/shared/evidence/**
src/observability/**
MCP evidence manifests
```

Any path assuming:

```text
test-results/mcp
```

must map to:

```text
artifacts/test-results/mcp
```

unless a more precise existing contract requires another nested path.

Do not alter evidence schema unless path field normalization requires it.

---

# 58. Selector Catalog

Move logical root:

```text
selector-catalog/
→ artifacts/selector-catalog/
```

Update:

- snapshot_page,
- browser intelligence,
- locator catalog lookup,
- generator fallback,
- healer re-snapshot,
- artifact listing,
- docs,
- tests.

---

# 59. File Content Helpers

Existing file-content helpers currently use committed fixture bank.

Update:

```text
test-fixtures/
→ tests/data/
```

Ensure:

- PDF tests,
- Excel tests,
- image upload,
- invalid file tests,
- network contract tests

continue to pass.

---

# 60. Network Contract Helpers

Update default contract directory:

```text
tests/data/network/contracts/
```

Maintain:

- partial-match behavior,
- secret redaction,
- feature-specific contract semantics.

---

# 61. Demo Tests

Move:

```text
src/tests/demo/
→ tests/demo/
```

Preserve project:

```text
demo
```

Ensure normal:

```text
npm test
```

still excludes demo tests.

Ensure:

```text
npm run test:demo
```

still works.

---

# 62. `src/pages/.bak`

Current `src/pages/` includes `.bak`.

Audit before migration.

Do not carry stale backup code into `tests/pages/` without reason.

Classify:

- needed migration backup,
- obsolete tracked artifact.

Prefer removing obsolete backup content in dedicated cleanup commit if safe.

---

# 63. Documentation Information Architecture

Recommended target:

```text
docs/
├── qa/
│   ├── START-HERE.md
│   ├── REPOSITORY-MAP.md
│   ├── REQUIREMENTS.md
│   └── REVIEWING-AI-TESTS.md
│
├── automation/
│   ├── TESTS.md
│   ├── PAGES.md
│   ├── FIXTURES.md
│   └── TEST-DATA.md
│
├── framework/
│   ├── MCP.md
│   ├── MAINTENANCE.md
│   └── AGENT-CONTRACTS.md
│
├── architecture/
├── engineering/
├── recipes/
└── reference/
```

Do not rewrite every doc from scratch unless needed.

First migrate links and ownership.

---

# 64. README 60-Second Repository Map

Place near top:

```text
requirements/  → QA writes requirements
specs/         → AI creates plans; QA reviews
tests/         → Playwright automation
artifacts/     → results and reports

Usually not needed for daily QA:
src/           → framework engine
tools/         → maintainer tooling
config/        → advanced configuration
```

Primary workflow remains Hermes-oriented.

---

# 65. QA Learning Levels

Documentation should support:

## Level 0 — Hermes user

Need know:

```text
give requirement → review result
```

## Level 1 — QA basic

Need know:

```text
requirements
specs
tests
artifacts
```

## Level 2 — QA automation

Need know:

```text
tests/pages
tests/fixtures.ts
tests/data
config
```

## Level 3 — framework maintainer

Need know:

```text
src
tools
.github/agents
MCP
reporting
pipeline
```

---

# 66. Boundary README Files

Add concise README only at major boundaries if useful:

```text
tests/README.md
src/README.md
tools/README.md
```

Avoid README spam.

### `src/README.md`

Explain:

- framework internal,
- normal QA should not edit,
- framework maintenance only.

### `tests/README.md`

Explain:

- generated tests are committed source,
- POM location,
- fixture adapter,
- data location.

### `tools/README.md`

Explain:

- MCP,
- validators,
- operational scripts,
- maintainer ownership.

---

# 67. Architecture Validator

Create:

```text
npm run validate:architecture
```

Validator should check at minimum:

### PATH001

No `src/tests/`.

### PATH002

No product `.spec.ts` under protected internal areas.

### PATH003

Canonical directories from workspace manifest exist.

### PATH004

No legacy `mcp-server/`.

### PATH005

No legacy root `scripts/`.

### PATH006

No legacy root `environments/`.

### PATH007

No legacy `test-fixtures/`.

### PATH008

No legacy `example/erpku/`.

### PATH009

No old root secondary Playwright config files.

### PATH010

No runtime output configured outside `artifacts/` unless explicitly allowlisted.

### PATH011

`playwright.config.ts` testDir resolves to `tests`.

### PATH012

setup project resolves to `tests/auth.setup.ts`.

### PATH013

workspace manifest schema valid.

### PATH014

test data resolves under `tests/data`.

### PATH015

no forbidden test import into protected internals.

---

# 68. Legacy String Scanner

Architecture validation should scan source/config/docs selectively for stale strings:

```text
src/tests
mcp-server
test-fixtures
environments/
example/erpku
reports/
test-results/
selector-catalog/
playwright.unit.config
playwright.mobile.config
playwright.cross-browser.config
```

But support allowlist for:

- CHANGELOG historical text,
- migration docs,
- docs explicitly comparing old/new paths.

Do not fail CI on legitimate historical references.

---

# 69. Import Boundary Validator

Add rule:

```text
tests/** cannot directly import protected internals
```

Initial implementation may use:

- ESLint restriction,
- custom validator,
- both.

Suggested banned targets from tests:

```text
src/agents
src/cli
src/executor
src/observability
src/setup
tools/
```

Allow:

```text
src/public
```

During migration, temporary allowlist may include known legacy imports.

Goal: allowlist reaches zero or documented minimal exceptions.

---

# 70. CI Integration

Add `validate:architecture` to quality gate:

```text
quality:check-rules
```

or suitable stage.

Final `test:quality` must fail if architecture drifts.

---

# 71. Quality Gate Order

Recommended:

```text
format:check
lint
typecheck
validate:architecture
mcp:typecheck
requirement validation
generated-test validation
property tests
unit tests
file-content tests
network tests
mcp build
health check
```

Do not make expensive browser run mandatory merely to validate folder names if current quality pipeline avoids it.

---

# 72. Pre-Migration Inventory Task

Before moving ANY file, harness must run repository-local search:

```bash
rg -n "src/tests|src/pages|src/fixtures|src/support/auth\.setup|test-fixtures|mcp-server|scripts/|environments/|example/erpku|reports/|test-results/|selector-catalog/|playwright\.(unit|mobile|cross-browser|config\.base)" .
```

Also:

```bash
rg -n "from ['\"]@/|require\(['\"]@/" tests src tools .
```

Save inventory summary in implementation notes.

Do not rely solely on this planning document for exact occurrences because repository may have evolved.

---

# 73. Baseline Test Capture

Before refactor run:

```text
npm run format:check
npm run lint
npm run typecheck
npm run validate
npm run validate:requirement -- requirements/auth/sample-login-empty-fields.md
npm run test:property
npm run test:unit
npm run test:file-content
npm run test:network-assert
npm run mcp:typecheck
npm run mcp:build
npm run health:check
```

Also:

```bash
npx playwright test --list
```

Record:

- exit codes,
- discovered tests,
- known failures,
- warnings,
- baseline artifact paths.

Do not attribute pre-existing failures to migration.

---

# 74. Migration Execution Principles

Harness rules:

1. Never perform entire migration as one blind mass move.
2. Make path registry before broad path moves.
3. Preserve command names.
4. Preserve runtime semantics.
5. Migrate one domain at a time.
6. Run targeted validation after each domain.
7. Remove compatibility fallback as soon as consumer migration completes.
8. Do not keep duplicate canonical paths.
9. Update docs/contracts in same task that changes user-visible path.
10. Commit/PR boundaries should remain reviewable.

---

# 75. Phase Overview

```text
PHASE 0  Baseline + inventory
PHASE 1  Workspace contract
PHASE 2  Public API/test adapter
PHASE 3  tests/ migration
PHASE 4  auth + POM + test data
PHASE 5  artifacts consolidation
PHASE 6  tooling migration
PHASE 7  configuration migration
PHASE 8  examples + docs cleanup
PHASE 9  agents/Hermes contracts
PHASE 10 validators + CI enforcement
PHASE 11 end-to-end regression
PHASE 12 legacy removal + architecture freeze
```

---

# 76. PHASE 0 — Baseline & Inventory

## HYB-0001 — Create Migration Branch

Goal:

- isolate structural refactor.

Recommended branch:

```text
refactor/hybrid-architecture
```

Acceptance:

- [ ] clean working tree,
- [ ] baseline commit recorded,
- [ ] no unrelated changes bundled.

---

## HYB-0002 — Inventory Root

Record:

- directories,
- root config files,
- root validators,
- docs.

Acceptance:

- [ ] current tree documented in migration notes,
- [ ] unknown folder purpose identified before moving.

---

## HYB-0003 — Inventory Path References

Run `rg` searches from §72.

Acceptance:

- [ ] every old path category has consumer list,
- [ ] code vs docs references separated,
- [ ] generated/build outputs excluded.

---

## HYB-0004 — Inventory Test Discovery

Run:

```bash
npx playwright test --list
```

Capture:

- setup,
- demo,
- product,
- seed behavior.

Acceptance:

- [ ] baseline count recorded,
- [ ] project mapping recorded.

---

## HYB-0005 — Baseline Quality Gates

Run §73 commands.

Acceptance:

- [ ] baseline status captured,
- [ ] pre-existing failures noted,
- [ ] no migration started before baseline.

---

# 77. PHASE 1 — Workspace Contract

## HYB-0101 — Add Workspace Manifest

Create:

```text
config/qa-kit.workspace.json
```

Initially point to CURRENT paths if needed for staged migration:

```text
tests: src/tests
```

Then migrate later.

Acceptance:

- [ ] schemaVersion,
- [ ] required path keys,
- [ ] ownership keys,
- [ ] JSON validation.

---

## HYB-0102 — Add Manifest Type

Create typed schema/interface.

Acceptance:

- [ ] invalid manifest fails clearly,
- [ ] missing key produces actionable error.

---

## HYB-0103 — Add Workspace Resolver

Create canonical workspace path accessor.

Acceptance:

- [ ] repository root resolution,
- [ ] absolute + relative forms as needed,
- [ ] cross-platform Windows safe,
- [ ] no current command regression.

---

## HYB-0104 — Unit Test Workspace Resolver

Test:

- Windows separators,
- POSIX separators,
- missing manifest,
- malformed manifest,
- root resolution.

---

## HYB-0105 — Migrate First Consumers

Choose low-risk consumers:

- validator,
- fixturePath helper,
- coverage scanner.

Do not move files yet.

Acceptance:

- [ ] behavior unchanged,
- [ ] hardcoded path count reduced.

---

# 78. PHASE 2 — Public API / Test Adapter

## HYB-0201 — Inventory Test Imports

Classify every import from current product/demo/seed tests.

Categories:

```text
fixture
auth
metadata
PW helper
shared type
POM
internal accidental dependency
```

---

## HYB-0202 — Define Stable Public Surface

Create:

```text
src/public/
```

Only expose required stable test-facing APIs.

Acceptance:

- [ ] minimal exports,
- [ ] no broad `export *` from whole src tree,
- [ ] no internal CLI/MCP exposure.

---

## HYB-0203 — Public Fixture Export

Expose canonical:

```text
test
expect
```

and needed framework fixtures.

---

## HYB-0204 — Public Auth Export

Expose:

```text
authStatePath
```

and other stable auth helpers required by generated tests.

---

## HYB-0205 — Public Metadata Export

Expose test metadata helper(s) needed for reporter.

---

## HYB-0206 — Create `tests/fixtures.ts` After Tests Directory Exists

If `tests/` not yet created, stage file creation during Phase 3.

Acceptance:

- [ ] generated spec can use adapter,
- [ ] no protected internal import required for ordinary generated spec.

---

# 79. PHASE 3 — Playwright `tests/` Migration

## HYB-0301 — Create `tests/`

Create canonical test root.

Do not yet delete `src/tests`.

---

## HYB-0302 — Move Seed

```text
src/tests/seed.spec.ts
→ tests/seed.spec.ts
```

Update imports.

Run seed-targeted validation.

---

## HYB-0303 — Move Demo Tests

```text
src/tests/demo/**
→ tests/demo/**
```

Run:

```text
npm run test:demo
```

---

## HYB-0304 — Classify Unit/Property Tests

Do not blindly move.

For each file under:

```text
src/tests/unit
src/tests/property
```

decide:

- framework unit test,
- property test,
- Playwright product test.

Move to internal `__tests__` location where appropriate.

---

## HYB-0305 — Move Product E2E Specs

If present:

```text
src/tests/<feature>*.spec.ts
→ tests/<feature>*.spec.ts
```

Preserve role suffix and module grouping.

---

## HYB-0306 — Add Test Adapter

Create:

```text
tests/fixtures.ts
```

Migrate moved specs to adapter.

---

## HYB-0307 — Update Main Playwright testDir

Change:

```text
./src/tests
```

to:

```text
./tests
```

Update demo project.

---

## HYB-0308 — Test Discovery Gate

Run:

```bash
npx playwright test --list
```

Compare to baseline.

Acceptance:

- [ ] intended tests unchanged,
- [ ] no internal tests newly discovered.

---

## HYB-0309 — Remove `src/tests`

Only after:

- unit/property relocation complete,
- seed moved,
- demo moved,
- product specs moved,
- no imports/reference remain.

---

# 80. PHASE 4 — Auth, POM & Test Data

## HYB-0401 — Create Thin `tests/auth.setup.ts`

Wrap/reuse internal auth behavior.

Do not duplicate complex auth logic.

---

## HYB-0402 — Update Setup Project

Set setup project to find `tests/auth.setup.ts`.

---

## HYB-0403 — Auth Regression

Run:

```text
npm run auth:setup
```

where environment permits.

At minimum verify discovery/list behavior when credentials unavailable.

---

## HYB-0404 — Classify `src/pages`

Inspect each POM.

Move application-facing POM:

```text
src/pages/**
→ tests/pages/**
```

Keep genuine framework abstraction internal.

---

## HYB-0405 — Update POM Registration

Current project fixture registration must find target POM.

No stale path references.

---

## HYB-0406 — Move Test Fixture Bank

```text
test-fixtures/**
→ tests/data/**
```

---

## HYB-0407 — Update fixturePath Helper

Resolve through workspace manifest.

---

## HYB-0408 — File Content Regression

Run:

```text
npm run test:file-content
npm run test:network-assert
```

Include PDF/Excel/image/invalid/network cases.

---

## HYB-0409 — Delete Legacy `test-fixtures`

After zero references.

---

# 81. PHASE 5 — Artifact Consolidation

## HYB-0501 — Create Artifacts Root

```text
artifacts/
```

---

## HYB-0502 — Playwright OutputDir

Move:

```text
test-results
→ artifacts/test-results
```

---

## HYB-0503 — JSON Reporter Output

Move:

```text
test-results/results.json
→ artifacts/test-results/results.json
```

---

## HYB-0504 — HTML Report

Move:

```text
reports/html
→ artifacts/reports/html
```

---

## HYB-0505 — Custom Report Root

Move all custom report runtime storage under:

```text
artifacts/reports/
```

Preserve report history semantics.

---

## HYB-0506 — Blob Report

Move:

```text
blob-report
→ artifacts/blob-report
```

---

## HYB-0507 — Selector Catalog

Move:

```text
selector-catalog
→ artifacts/selector-catalog
```

---

## HYB-0508 — Evidence Manifest

Move hardcoded evidence paths.

---

## HYB-0509 — Reporter/Dashboard Regression

Test:

- current report generation,
- history listing,
- detail loading,
- compare,
- archive save/view/delete/compare,
- dashboard server.

---

## HYB-0510 — Remove Legacy Runtime Roots

Delete/ignore stale:

```text
reports/
test-results/
blob-report/
selector-catalog/
```

after migration.

---

# 82. PHASE 6 — Tooling Migration

## HYB-0601 — Create `tools/`

---

## HYB-0602 — Move Scripts

```text
scripts/
→ tools/scripts/
```

Update root scripts.

---

## HYB-0603 — Move Root Validators

```text
validate-generated-tests.ts
validate-requirement.ts
setup-check.ts
```

to:

```text
tools/validators/
```

Choose clean filenames.

---

## HYB-0604 — Script Unit Tests

Move corresponding script tests.

Run all tool tests.

---

## HYB-0605 — Move MCP Nested Package

```text
mcp-server/
→ tools/mcp/
```

Use `git mv` where possible to preserve history.

---

## HYB-0606 — Update MCP Build Commands

Update `package.json`.

---

## HYB-0607 — Update `.mcp.json`

Update server executable/build path.

---

## HYB-0608 — Update Bootstrap/Config Generator

All generated Hermes/MCP configs must point to new location.

---

## HYB-0609 — MCP Regression

Run:

```text
npm run mcp:typecheck
npm run mcp:build
npm run mcp:check
npm run health:check
```

---

## HYB-0610 — Remove Old Tool Roots

Ensure no:

```text
mcp-server/
scripts/
```

remain.

---

# 83. PHASE 7 — Configuration Migration

## HYB-0701 — Move Environments

```text
environments/
→ config/environments/
```

---

## HYB-0702 — Update Env Loader

---

## HYB-0703 — Update Env CLIs

---

## HYB-0704 — Env Regression

Run:

```text
env:status
env:use
setup:check
health:check
```

safe permutations.

---

## HYB-0705 — Move Base Playwright Config

```text
playwright.config.base.ts
→ config/playwright/base.ts
```

---

## HYB-0706 — Move Special Configs

```text
playwright.cross-browser.config.ts
→ config/playwright/cross-browser.ts

playwright.mobile.config.ts
→ config/playwright/mobile.ts

playwright.unit.config.ts
→ config/playwright/unit.ts
```

---

## HYB-0707 — Update package scripts

Maintain command names.

---

## HYB-0708 — Config Regression

Run:

- main test list,
- unit tests,
- demo tests,
- cross-browser list/config load,
- mobile list/config load.

Full browser execution only where environment allows.

---

# 84. PHASE 8 — Examples + Documentation Cleanup

## HYB-0801 — Move ERPku Example

```text
example/erpku/
→ examples/erpku/
```

---

## HYB-0802 — Update TypeScript Alias

---

## HYB-0803 — Example Config Regression

Ensure example imports/config compile.

---

## HYB-0804 — Root Docs Classification

Move:

```text
CONTEXT.md
CUSTOM-MCP.md
MAINTENANCE.md
```

to chosen docs hierarchy.

---

## HYB-0805 — Link Migration

Update all relative links.

---

## HYB-0806 — README Architecture

Replace old:

```text
requirements
specs
src/tests
...
```

with final map.

---

## HYB-0807 — README 60-Second Map

Add QA learning section.

---

## HYB-0808 — ARCHITECTURE.md Rewrite

Architecture must clearly state:

```text
requirements → specs → tests → artifacts
```

and ownership boundaries.

---

## HYB-0809 — DIRECTORY-MAP

Update all path rows.

Do not retain old paths except migration-history section.

---

## HYB-0810 — Cheatsheet / Getting Started

Update commands/output locations.

---

# 85. PHASE 9 — AI Agents / Hermes

## HYB-0901 — AGENTS Ownership Contract

Add filesystem policy.

---

## HYB-0902 — AGENTS Path Migration

Update every path.

---

## HYB-0903 — Planner Agent

Update seed and plan/test path semantics.

---

## HYB-0904 — Generator Agent

Hard-code canonical output policy:

```text
tests/**
```

---

## HYB-0905 — Healer Agent

Add protected-area stop boundary.

---

## HYB-0906 — Reporter Agent

Update artifact roots.

---

## HYB-0907 — `.github/AGENTS.md`

Review nested instructions for path conflicts.

---

## HYB-0908 — Agent Registry Validation

Run:

```text
npm run validate:agents
```

or current equivalent.

---

## HYB-0909 — Hermes Response Vocabulary

Ensure summaries prefer:

```text
Requirement
Plan
Test
Result
```

and canonical paths.

---

# 86. PHASE 10 — Architecture Enforcement

## HYB-1001 — Build Architecture Validator

Implement PATH001–PATH015.

---

## HYB-1002 — Stale String Scan

Add old-path checker.

---

## HYB-1003 — Import Boundary Rule

Prevent new tests from importing protected internals.

---

## HYB-1004 — Add npm script

```json
"validate:architecture": "..."
```

---

## HYB-1005 — Add to Quality Gate

---

## HYB-1006 — Negative Validator Tests

Fixtures should prove validator rejects:

- `src/tests/foo.spec.ts`,
- `mcp-server/`,
- `test-fixtures/`,
- forbidden import.

---

# 87. PHASE 11 — Full Regression

## HYB-1101 — Formatting

```text
npm run format:check
```

---

## HYB-1102 — Lint

```text
npm run lint
```

---

## HYB-1103 — Typecheck

```text
npm run typecheck
```

---

## HYB-1104 — Architecture Validation

```text
npm run validate:architecture
```

---

## HYB-1105 — Generated Test Validation

```text
npm run validate
```

---

## HYB-1106 — Requirement Validation

Use sample requirement.

---

## HYB-1107 — Property Tests

---

## HYB-1108 — Unit Tests

---

## HYB-1109 — File Content Tests

---

## HYB-1110 — Network Tests

---

## HYB-1111 — MCP Typecheck

---

## HYB-1112 — MCP Build

---

## HYB-1113 — MCP Compatibility

---

## HYB-1114 — Test List Diff

Compare baseline vs final.

---

## HYB-1115 — Demo Test

---

## HYB-1116 — Auth Setup Discovery

---

## HYB-1117 — Health Check

---

## HYB-1118 — QA Run Dry/Controlled Flow

Run:

```text
npm run qa:run -- requirements/<safe-sample>.md
```

Ensure emitted Hermes instruction uses new paths.

---

## HYB-1119 — Full Quality Gate

```text
npm run test:quality
```

where environment supports.

---

# 88. PHASE 12 — Legacy Removal & Freeze

## HYB-1201 — Search Old Paths

Run exhaustive `rg`.

No code references allowed except explicit migration history.

---

## HYB-1202 — Remove Temporary Fallback

Workspace resolver must use final paths.

---

## HYB-1203 — Delete Empty Legacy Directories

No:

```text
src/tests/
mcp-server/
scripts/
environments/
test-fixtures/
example/
```

unless other legitimate content exists.

---

## HYB-1204 — Root File Audit

Target root matches architecture.

---

## HYB-1205 — Architecture Decision Record

Add/update ADR:

```text
Hybrid Playwright-Native Repository Architecture
```

Include:

- why `requirements` stays root,
- why `specs` stays root,
- why `tests` leaves `src`,
- why `src` remains framework engine,
- why output consolidates to `artifacts`,
- why tools/config are grouped.

---

## HYB-1206 — Changelog

Record breaking internal path migration.

---

## HYB-1207 — Final Quality Gate

All green or documented environment-dependent exceptions.

---

# 89. Recommended Pull Request Strategy

Avoid one enormous unreviewable diff if implementation flow supports multiple PRs.

## PR 1 — Workspace Contract

```text
manifest
workspace resolver
tests
```

No file movement.

---

## PR 2 — Test Public API

```text
src/public
test import adapter preparation
```

---

## PR 3 — Playwright Workspace

```text
src/tests → tests
seed
demo
auth entrypoint
POM
test data
```

---

## PR 4 — Artifacts

```text
reports
test-results
selector catalog
dashboard/reporter paths
```

---

## PR 5 — Tooling

```text
scripts
validators
mcp-server → tools/mcp
```

---

## PR 6 — Config

```text
environments
playwright configs
```

---

## PR 7 — Docs / Examples / Agents

Can be split further if large.

---

## PR 8 — Enforcement / Cleanup

```text
architecture validator
legacy removal
ADR
```

If repository policy prefers one migration PR, still implement internally in this task order and commit checkpoints.

---

# 90. Harness Execution Contract

When this plan is given to an AI coding harness:

```markdown
Implement the Hybrid Architecture Migration according to this planning document.

Rules:

1. Work in task-ID order unless a dependency requires a tightly scoped reorder.
2. Before each phase, inspect the current repository because it may have changed after this plan was written.
3. Do not assume a file still exists at the path documented here.
4. Do not skip baseline/inventory.
5. Do not mass-replace paths without understanding their semantic use.
6. Preserve public npm command names unless the plan explicitly changes them.
7. Preserve Playwright behavior.
8. Preserve requirement/pipeline/report semantics.
9. Do not implement Prompt Studio.
10. Do not change authentication storage convention.
11. Do not modify protected framework behavior merely to make tests pass.
12. Introduce canonical workspace path resolution before broad path moves.
13. Add or update tests with every behavioral path migration.
14. Run targeted checks after each task group.
15. Stop the phase if a migration creates unexplained test discovery differences.
16. Report:
    - task IDs completed,
    - files moved,
    - imports changed,
    - commands changed internally,
    - tests/checks run,
    - failures,
    - remaining legacy paths.
```

---

# 91. Harness Phase Completion Report Template

```markdown
## Phase <N> Completion

### Completed

- HYB-XXXX
- HYB-XXXX

### File moves

- old/path → new/path

### Contract changes

- ...

### Validation run

- `npm run ...` — PASS
- `npm run ...` — PASS

### Baseline differences

- none
  or
- ...

### Remaining legacy references

- ...

### Blockers

- none
  or
- ...

### Safe to continue

YES / NO
```

---

# 92. Stop Conditions

Harness must stop current migration phase if:

- Playwright discovers unintended tests,
- baseline product test disappears,
- auth setup begins running as a normal product spec,
- reporter cannot find previous expected current-run result,
- MCP build changes tool names unexpectedly,
- requirement parser behavior changes,
- environment selection changes,
- generated tests require direct imports into random framework internals,
- migration requires changing business behavior unrelated to paths,
- architecture validator requires massive allowlisting to pass.

Resolve root cause before continuing.

---

# 93. Rollback Strategy

Every major domain move should be reversible via Git.

Do not create copies where move is possible.

Prefer:

```bash
git mv
```

to preserve history.

Rollback unit:

```text
tests migration
artifact migration
tooling migration
config migration
```

Do not depend on manual recovery from uncommitted mass changes.

---

# 94. Success Criteria

Migration is complete only if all statements are true.

## Architecture

- [ ] `requirements/` is canonical QA input.
- [ ] `specs/` is canonical Planner output.
- [ ] `tests/` is canonical Playwright test root.
- [ ] `src/tests/` no longer exists.
- [ ] framework engine remains under `src/`.
- [ ] tooling is grouped under `tools/`.
- [ ] environment/config support is under `config/`.
- [ ] runtime output is under `artifacts/`.
- [ ] examples are under `examples/`.

## Playwright

- [ ] `playwright.config.ts` remains at root.
- [ ] main `testDir` is `./tests`.
- [ ] seed test is under `tests/`.
- [ ] auth setup entrypoint is under `tests/`.
- [ ] setup project remains dependency-based.
- [ ] test discovery equivalent to baseline.

## QA Usability

- [ ] README teaches Requirement → Plan → Test → Result.
- [ ] QA does not need to understand `src/` for normal work.
- [ ] generated tests are clearly first-class source.
- [ ] test data is clearly distinct from fixture code.

## Hermes / AI

- [ ] ownership boundary documented.
- [ ] Healer has protected-area guardrail.
- [ ] Generator outputs only to `tests/`.
- [ ] Planner references correct seed.
- [ ] Reporter references artifacts root.
- [ ] orchestration output uses canonical vocabulary.

## Engineering

- [ ] workspace manifest exists.
- [ ] typed resolver exists.
- [ ] architecture validator exists.
- [ ] stale legacy paths rejected.
- [ ] test imports use stable public adapter where applicable.
- [ ] quality gate includes architecture validation.

## Commands

- [ ] existing user-facing npm commands remain usable.
- [ ] MCP build/typecheck works.
- [ ] environment tools work.
- [ ] auth setup works.
- [ ] QA run works.
- [ ] dashboard/report archive commands work.

---

# 95. Definition of Done for Each Task

A task is NOT done when files only moved.

Each task must include:

```text
code/path update
+ dependent import update
+ docs/agent update if user-visible
+ targeted validation
+ no stale canonical references
```

---

# 96. Decision Log — Why This Structure

## Why keep `requirements/` at root?

Because it is the primary QA Kit extension and the first human input to the pipeline.

It should be immediately discoverable.

---

## Why keep `specs/` at root?

Because it aligns well with Playwright Agent workflow and is already established in QA Kit.

Moving it to `qa/plans` adds custom convention with limited benefit.

---

## Why move `src/tests` to `tests`?

Because executable Playwright tests are application/test workspace source, not framework implementation.

It also aligns with default Playwright expectations.

---

## Why keep `src/`?

Because it remains a conventional source-code engine boundary.

Renaming `src` to `framework` adds churn without enough benefit.

---

## Why add `src/public`?

Because generated tests should consume a stable API rather than internal folder structure.

---

## Why create `tests/fixtures.ts`?

Because custom Playwright fixtures are the natural adapter point between test code and QA Kit internals.

---

## Why move `test-fixtures` to `tests/data`?

Because file samples are test data, while Playwright uses the word fixture for code-based setup/dependency injection.

---

## Why create `artifacts/`?

Because current output is scattered across several root locations.

One generated-output boundary makes QA learning and tooling safer.

---

## Why group scripts/MCP under `tools/`?

Because they are maintainer/operational tooling, not daily QA workflow.

---

## Why group environments/config?

Because configuration is advanced surface and should not visually compete with QA golden path.

---

# 97. Risks

## Risk 1 — Hidden hardcoded paths

Mitigation:

- exhaustive `rg`,
- workspace path registry,
- architecture validator.

---

## Risk 2 — Test discovery changes

Mitigation:

- baseline `--list`,
- final diff,
- careful unit/property classification.

---

## Risk 3 — Auth setup regression

Mitigation:

- thin entrypoint,
- preserve engine logic,
- setup project dependency test.

---

## Risk 4 — MCP config break

Mitigation:

- move nested package atomically,
- update generated config tool,
- health check.

---

## Risk 5 — Dashboard/archive path break

Mitigation:

- reporter integration tests,
- archive operation regression.

---

## Risk 6 — AI agent edits protected internals

Mitigation:

- AGENTS ownership policy,
- healer stop boundary,
- architecture validator/import rule.

---

## Risk 7 — Gitignore accidentally drops useful history

Mitigation:

- classify runtime vs durable archive before ignore changes.

---

## Risk 8 — Docs become inconsistent

Mitigation:

- stale string scan includes docs,
- migration links in same commit.

---

# 98. Anti-Patterns During Migration

Do NOT:

- make all paths configurable “for flexibility,”
- create a second competing test root,
- maintain permanent legacy symlinks,
- leave wrapper files in old locations forever,
- combine architecture migration with UI redesign,
- combine architecture migration with Prompt Studio,
- rewrite all agents from scratch,
- regenerate official agents in-place without reviewing QA Kit customizations,
- change role/auth semantics,
- change reporter schema unless required,
- create 20 new abstractions before proving need,
- move internal unit tests into product E2E discovery.

---

# 99. Suggested Architecture Validation Output

Friendly human output:

```text
Architecture check

✓ requirements/ exists
✓ specs/ exists
✓ tests/ is Playwright root
✓ artifacts/ contains runtime output
✓ no src/tests legacy directory
✓ no mcp-server legacy directory
✓ no test-fixtures legacy directory
✓ test imports respect framework boundary
✓ workspace manifest valid

Hybrid architecture: VALID
```

Failure example:

```text
Architecture check failed

✗ Product test found in protected path:
  src/tests/invoice.spec.ts

Expected:
  tests/invoice.spec.ts
```

---

# 100. Final Architecture Mental Model

For QA:

```text
requirements → specs → tests → artifacts
```

For QA Automation:

```text
tests/
├── *.spec.ts
├── pages/
├── fixtures.ts
└── data/
```

For Framework Maintainer:

```text
src/
tools/
config/
.github/agents/
```

For Hermes:

```text
requirements  = write/assist
specs         = generate/review
tests         = generate/heal
artifacts     = inspect

src/tools/config = protected by default
```

---

# 101. Final Decision

The migration target is:

```text
requirements/
      ↓
specs/
      ↓
tests/
      ↓
artifacts/

src/       = QA Kit engine
tools/     = maintainer tooling
config/    = advanced configuration
docs/      = knowledge
examples/  = reference implementations
```

This architecture intentionally preserves Playwright-native conventions where they matter while adding clear QA Kit ownership boundaries around them.

The architecture should be considered stable after:

1. path registry is canonical,
2. legacy paths are removed,
3. agent contracts are updated,
4. architecture validation is enforced by CI,
5. full quality gate passes.

Only after this phase is stable should future product surfaces be built on top of it.

---

# 102. Sources Reviewed During Planning

Current Playwright QA Kit:

- https://github.com/k-ardliyan/playwright-qa-kit
- https://raw.githubusercontent.com/k-ardliyan/playwright-qa-kit/main/AGENTS.md
- https://raw.githubusercontent.com/k-ardliyan/playwright-qa-kit/main/ARCHITECTURE.md
- https://raw.githubusercontent.com/k-ardliyan/playwright-qa-kit/main/playwright.config.ts
- https://raw.githubusercontent.com/k-ardliyan/playwright-qa-kit/main/package.json
- https://raw.githubusercontent.com/k-ardliyan/playwright-qa-kit/main/tsconfig.json

Playwright:

- https://playwright.dev/docs/intro
- https://playwright.dev/docs/test-agents
- https://playwright.dev/docs/auth
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/test-projects
- https://playwright.dev/docs/api/class-testconfig

---

# 103. Start Here for the Implementation Harness

The implementation harness should begin with:

```text
HYB-0001
HYB-0002
HYB-0003
HYB-0004
HYB-0005
```

Then STOP and compare the actual repository inventory against this document.

If the repository has evolved, update the migration inventory—not the architectural principles—before moving files.

After baseline validation, continue:

```text
Workspace Contract
→ Public API
→ tests/
→ auth/POM/data
→ artifacts/
→ tools/
→ config/
→ docs/examples
→ agents
→ enforcement
→ regression
→ cleanup
```

The harness must not skip directly to file moves.

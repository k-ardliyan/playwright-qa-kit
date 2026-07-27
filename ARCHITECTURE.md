# Playwright QA Kit — Architecture Index

> Entry point untuk navigasi codebase. Baca ini sebelum buka file lain.

## Apa ini?

Framework Playwright TypeScript untuk AI-driven E2E testing. AI agent (Hermes, Cursor, Codex, Kiro)
menggerakkan pipeline: Requirement → Plan → Generate → Execute → Heal → Report.

## Layer Diagram

```
requirements/          ← QA User menulis requirement di sini
       ↓
.github/agents/        ← Sub-agent instructions (planner, generator, healer, reporter)
       ↓
specs/                 ← Planner output: test plan markdown
       ↓
src/tests/             ← Generator output: Playwright TypeScript specs
       ↓
src/fixtures/          ← Fixture chain: framework → base → project
src/pages/             ← Page Object Models (optional, registered di project.fixture.ts)
src/support/pw/        ← Low-level PW helpers (barrel: src/support/pw/index.ts)
       ↓
reports/               ← Runtime output: pipeline-state.json, HTML, archive/
selector-catalog/      ← ARIA snapshots per page (auto-generated)
```

## Canonical References

> Tabel lengkap ada di [`AGENTS.md`](AGENTS.md) § Architecture Quick Reference — di-load otomatis setiap sesi.
> WHY di balik setiap constraint: [`docs/architecture/DECISIONS.md`](docs/architecture/DECISIONS.md)
> Failure lessons dari sesi sebelumnya: [`docs/architecture/LESSONS-LEARNED.md`](docs/architecture/LESSONS-LEARNED.md)

## Key Conventions (inline)

```ts
// ✅ Correct import — always from fixture, never from @playwright/test directly
import { test, expect } from '@/fixtures/base.fixture';

// ✅ Auth — always use helper, never hardcode .auth/ path
import { authStatePath } from '@/support/auth-paths';
test.use({ storageState: authStatePath('finance') });

// ✅ Shared types barrel
import type { PipelineReport } from '@/shared/types';

// ✅ PW helpers barrel
import { networkMock, waitAndAssertApi } from '@/support/pw';
```

- `APP_ENV` is the sole environment selector — never `NODE_ENV` for target switching
- Auth files: `.auth/{APP_ENV}/<role>.json`
- Test naming: `src/tests/<feature>[-<role>].spec.ts`
- Specs with unknown selectors → call `browser_snapshot` first, NEVER guess
- Blocked scenario → `test.skip(true, '<reason>')`, NEVER delete

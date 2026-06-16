# Fork Onboarding — New QA Project from Template

This guide implements [ADR-0003: Template Fork Deployment Model](adr/0003-template-fork-deployment-model.md). Each QA project gets its own Git repository forked or copied from the `playwright-qa-kit` template core.

---

## 1. Create your project repository

**Option A — GitHub fork**

1. Fork the template repository on GitHub.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-org>/<your-project>-automation.git
cd <your-project>-automation
npm install
npx playwright install --with-deps chromium
npm run mcp:build
```

**Option B — Duplicate (no GitHub fork link)**

1. Use GitHub "Use this template" or copy the repo to a new remote.
2. Follow the same clone and install steps above.

---

## 2. Rename (optional)

Update `package.json` `name` and `description` to match your project. This is cosmetic only — tests and CI do not depend on the package name.

---

## 3. Configure Git remotes

Your fork should have two remotes:

| Remote     | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `origin`   | Your project repository (push/pull daily work here) |
| `upstream` | Template core repository (pull framework updates)   |

```bash
# origin is set automatically when you clone your fork
git remote add upstream https://github.com/<template-org>/playwright-qa-kit.git
git remote -v
```

---

## 4. Upstream sync workflow

When the template core releases fixes (MCP server, agents, parsers, CI):

```bash
git fetch upstream
git checkout main
git merge upstream/main
# resolve conflicts if any (see conflict-prone files below)
npm install
npm run test:quality
```

Prefer merging `upstream/main` on a schedule (e.g. monthly) rather than letting forks diverge for months.

### Conflict-prone files

| File / folder                                 | Owner                                         | Merge strategy                                                                            |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/fixtures/project.fixture.ts`             | **Fork** — your POM registrations             | Keep yours; rarely accept upstream wholesale                                              |
| `playwright.config.base.ts`                   | **Upstream** — shared execution policy        | Accept upstream wholesale (retries, workers, timeout, `use`)                              |
| `playwright.config.ts`                        | **Fork** — project-specific projects/timeouts | Merge carefully; take upstream base + defaults, re-apply your `projects` / reporter paths |
| `environments/*.env`                          | **Fork** (gitignored)                         | Never committed; copy new keys from `*.env.example` manually                              |
| `environments/*.env.example`                  | **Shared**                                    | Accept upstream generic keys; keep your extra keys                                        |
| `requirements/`, `specs/`, `src/tests/`       | **Fork**                                      | Keep yours; upstream should not touch these                                               |
| `example/erpku/`                              | **Template sample**                           | Accept upstream updates or delete if unused                                               |
| `.github/agents/`, `mcp-server/`, `AGENTS.md` | **Upstream**                                  | Prefer upstream — these are framework core                                                |

---

## 5. Day-one customization — project.fixture.ts

On fork day one, register your application's Page Objects in [`src/fixtures/project.fixture.ts`](../src/fixtures/project.fixture.ts).

Use [`example/erpku/fixtures/project.fixture.ts`](../example/erpku/fixtures/project.fixture.ts) as a reference — it registers `loginPage`, `dashboardPage`, and customer POMs for the ERPKU adapter.

Template starting point (empty seam):

```typescript
export type ProjectFixtures = Record<string, never>;
export const projectTest = base.extend<ProjectFixtures>({});
```

After customization, tests import `@/fixtures/base.fixture` and receive your POM fixtures.

### Auth setup (forks using a setup project)

If your Playwright config uses a `setup` project with `storageState`:

1. Create `support/auth.setup.ts` in your project tree (not under template `src/support/`).
2. Use your login POM for UI login — see [`example/erpku/support/auth.setup.ts`](../example/erpku/support/auth.setup.ts).
3. Point the setup project at `./support` in your `playwright.config.ts`.

The template core has **no** auth setup file; only the ERPKU reference adapter ships one.

---

## 6. Environment setup

1. Copy the template env file:

```bash
# Windows
copy environments\local.env.example environments\local.env
# Mac/Linux
cp environments/local.env.example environments/local.env
```

2. Fill universal keys: `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, etc.

3. **Adapter env overlay (forks with a Reference Adapter):** commit `{adapter}/environments/{name}.env.example` with app-specific non-secret defaults (e.g. `AUTH_*` paths). In the adapter `playwright.config.ts`, call:

```typescript
loadEnvironment({
  adapterEnv: { dir: 'example/erpku/environments', name: 'erpku' },
});
```

Core credentials in `environments/local.env` win — overlay only fills missing keys. Optional local override: `{dir}/{name}.env` (gitignored).

See [`example/erpku/environments/erpku.env.example`](../example/erpku/environments/erpku.env.example) for ERPKU reference values.

**Never commit** `environments/*.env` files containing real credentials.

---

## 7. Verify setup

```bash
npm run setup:check      # framework files present
npm run test:quality     # same gate as CI PR (no live app required)
npm test                 # template core — seed spec
```

If you keep the ERPKU reference adapter and have a running app + credentials:

```bash
npm run test:erpku-example -- --project=smoke
```

---

## 8. Optional — remove ERPKU example adapter

If your project does not need the ERPKU reference:

1. Delete `example/erpku/`.
2. Remove `@erpku/*` from `tsconfig.json` paths if nothing else references it.
3. Clear or replace `PLAYWRIGHT_ADAPTER_*` env defaults in `environments/local.env` if you use MCP validation on adapter specs (see [CUSTOM-MCP.md](../CUSTOM-MCP.md)).
4. Update [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) to run your own smoke/regression commands instead of `npm run test:erpku-example`.

The template core (`src/`) remains generic without the example folder.

---

## 9. Daily workflow reminder

| Task                    | Where                                 |
| ----------------------- | ------------------------------------- |
| Write requirements      | `requirements/`                       |
| Run Planner → test plan | `specs/`                              |
| Generator output        | `src/tests/*.spec.ts`                 |
| Register new POMs       | `src/fixtures/project.fixture.ts`     |
| Local credentials       | `environments/local.env` (gitignored) |

See [GUIDE.md](GUIDE.md) for the full QA pipeline on a local machine.

---

## Related documents

- [CONTEXT.md](../CONTEXT.md) — domain glossary (Framework Scope, Deployment Model)
- [ADR-0002](adr/0002-generic-multi-project-framework.md) — generic core vs application adapter
- [ADR-0003](adr/0003-template-fork-deployment-model.md) — why template fork

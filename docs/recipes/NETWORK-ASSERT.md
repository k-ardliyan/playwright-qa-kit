# Recipe: Network live assert (`@network-assert`)

Scenario-driven **live** request payload + response checks after a UI action. Helpers do **not** patent business fields — method, URL, status, and keys come from the requirement only.

## Tags

| Tag                 | When                                                               | Helpers                                                                                                           |
| --- | --- | --- |
| `(@network-assert)` | Assert payload FE→BE and/or response BE→FE after click/submit/open | `waitAndAssertApi` (prefer), `waitForApi`, `assertNetworkMatch` / `assertNetworkContract`, `startNetworkRecorder` |
| `(@network)`        | Mock/intercept HTTP for failure UX                                 | `mockJson`, `mockServerError`, `mockAbort`, `unmockAll`                                                           |
| `(@hybrid)`         | Seed/cleanup via API + UI assert                                   | `apiSeed`, `apiCleanup`                                                                                           |
| MCP network list    | Explore/heal only — **not** committed asserts                      | `browser_network_requests`                                                                                        |

**Do not overload `@network` for live observe.** Use `@network-assert`.

## Observe vs mock vs hybrid

| Goal                                         | Tag                              | Tool                                            |
| --- | --- | --- |
| Submit sends correct JSON + backend shape OK | `@network-assert`                | `waitAndAssertApi` + partial contract           |
| UI shows error when API 500                  | `@network`                       | `mockServerError`                               |
| Seed data then assert UI                     | `@hybrid`                        | `apiSeed`                                       |
| Offline multi-endpoint FE smoke              | optional later `@har` / `useHar` | HAR filtered `**/api/**`                        |
| Debug failure                                | (none)                           | `startNetworkRecorder` + `attachNetworkCapture` |

## Runtime helpers

```ts
import { waitAndAssertApi, waitForApi, assertNetworkMatch } from '@/support/pw';

// Preferred one-shot (inline keys from requirement Input Data)
await waitAndAssertApi(
  page,
  {
    method: 'POST',
    urlIncludes: '/api/demo/submit',
    status: [200, 201],
    assert: {
      request: { requiredKeys: ['name', 'qty'] },
      response: { matchObject: { ok: true } },
    },
    // optional: contract: 'tests/data/network/contracts/demo/submit-success.json',
  },
  async () => {
    await page.getByRole('button', { name: 'Submit' }).click();
  },
);
```

## Discover API path if QA does not know it yet

Framework **does not invent** endpoints. Two valid workflows:

### A. Write first (recommended when path known)

1. Put method + `urlIncludes` + keys in requirement Input Data
2. Tag `(@network-assert)`
3. Plan → Generate → Run

### B. Discover then freeze (when QA only knows the UI click)

1. Exploratory (not committed assert): run flow with Playwright MCP / headed browser
2. Call `browser_network_requests` (filter API) **or** open DevTools Network after click
3. Copy **method + URL path + request/response key names** into requirement Input Data
4. Then generate `@network-assert` — test asserts those frozen facts every run
5. Optional: save partial contract JSON under `tests/data/network/contracts/`

**Do not** leave generation guessing URLs. **Do not** call MCP network tools inside committed `.spec.ts`.

## Scenario-owned contract (required)

Write expected network facts in the requirement. Generator copies them into match/contract — nothing more.

```markdown
### SC-04: Submit create resource kirim payload valid (@success @network-assert)

**Input Data:**

- method: POST
- urlIncludes: /api/demo/submit
- status: 201
- request requiredKeys: name, qty
- request name: QA-KIT-NETWORK-OK
- contract: tests/data/network/contracts/demo/submit-success.json

**Langkah:**

1. Buka form
2. Isi field sesuai Input Data
3. Klik Submit
4. Tangkap network POST /api/demo/submit

**Hasil yang Diharapkan:**

- Request method POST ke URL mengandung `/api/demo/submit`
- Request body memuat `name`, `qty`
- Response status 2xx dan `ok: true`
- UI menampilkan status sukses (observable)
```

## Storage

| Path                                              | Git   | Role                       |
| --- | --- | --- |
| `tests/data/network/contracts/**`                 | Yes   | Partial expected contracts |
| `artifacts/test-results/**/network-capture*.json` | No    | Runtime attach (redacted)  |
| Full unfiltered browser HAR                       | Never | Diagnostic only            |

Secrets (`authorization`, `cookie`, `token`, …) are redacted by helpers before attach.

## Anti-patterns

| Anti-pattern                                     | Prefer                                 |
| --- | --- |
| Using `@network` for live payload assert         | `@network-assert` + `waitAndAssertApi` |
| Full response `toEqual` with timestamps/ids      | Partial `matchObject` / requiredKeys   |
| Assert every page-load asset/XHR                 | Filter `urlIncludes` API only          |
| Inventing endpoints not in requirement           | Input Data / Data scope only           |
| MCP `browser_network_requests` in committed spec | Runtime helpers only                   |
| Hardcoding product domain schema in helpers      | Scenario-owned keys                    |

## Service workers

If network events never fire:

```ts
test.use({ serviceWorkers: 'block' });
```

## Demo (kit tokens only)

```bash
npx playwright test tests/demo/demo-network-assert.spec.ts --project=demo
npm run test:network-assert
```

Demo uses `QA-KIT-NETWORK-OK` — do not copy as product expected fields.

## See also

- Sample requirement: `requirements/auth/sample-network-assert.md`
- Mock sample: `requirements/auth/sample-network-hybrid.md`
- Helpers: `src/support/pw/network-assert.ts`, `network-assert-core.ts`

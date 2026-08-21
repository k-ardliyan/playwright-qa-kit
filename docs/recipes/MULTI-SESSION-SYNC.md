# Multi-session (admin ↔ user) sync — recipe

Copy-paste pattern for **one test, two authenticated browser contexts**.  
Not a first-class capability tag yet — use when a single scenario must prove data sync across roles.

## When to use

| Use this recipe                                          | Prefer separate role specs instead                                             |
| --- | --- |
| Admin edits → user must see update in the **same** flow  | Independent checks per role (`invoice-admin.spec.ts` + `invoice-user.spec.ts`) |
| Real-time / same-session consistency                     | Permission-only (`@access-restriction`)                                        |
| Compare the **same data fields** (nominal, status, code) | Full-page visual equality (menus differ per role)                              |

## Prerequisites

- Auth files exist: `.auth/{APP_ENV}/admin.json` and `.auth/{APP_ENV}/user.json` (or your roles)
- `npm run auth:setup` (or headed for OTP/CAPTCHA)
- Prefer `authStatePath('admin')` from `@/support/auth-paths` when available

## Pattern (official Playwright multi-context)

```ts
import { test, expect } from '@/fixtures/base.fixture';
import { authStatePath } from '@/support/auth-paths'; // or hardcode `.auth/${APP_ENV}/…`

test('admin update syncs to user view', async ({ browser }) => {
  const adminContext = await browser.newContext({
    storageState: authStatePath('admin'),
  });
  const userContext = await browser.newContext({
    storageState: authStatePath('user'),
  });
  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();

  try {
    await test.step('Admin sets value', async () => {
      await adminPage.goto('/invoices/123');
      // … edit nominal / status from scenario Input Data …
    });

    await test.step('User sees updated fields', async () => {
      await userPage.goto('/invoices/123');
      // Assert **data fields** from scenario Expected Result — not full-page screenshot
      await expect(userPage.getByText('150.000')).toBeVisible();
    });
  } finally {
    await adminContext.close();
    await userContext.close();
  }
});
```

## Requirement writing tips

1. Put **both roles** in Metadata `Role scope` if the feature is role-aware.
2. In **Hasil**, list **observable fields** both sides must share (code, amount, status).
3. Do **not** mark as `@manual` only because two users are involved — dual context is automatable.
4. Real-time WebSocket UI: use `expect(locator).toHaveText(..., { timeout })` or soft polling; avoid fixed `sleep`.

## Anti-patterns

- Full-page `toHaveScreenshot` comparing admin vs user chrome (sidebar/menu differ)
- Inventing a role named `general` — general mode uses `user` auth
- Leaving contexts open (always `close()` in `finally`)
- Using headed pause for “switch account” — use storageState instead

## Related

- Auth paths: [docs/AUTH-CONTEXT-CONVENTION.md](../AUTH-CONTEXT-CONVENTION.md)
- Role projects recipe: [playwright.role-projects.recipe.ts](playwright.role-projects.recipe.ts)
- File content (export after admin action): [PDF-EXCEL-CONTENT-ASSERT.md](PDF-EXCEL-CONTENT-ASSERT.md)

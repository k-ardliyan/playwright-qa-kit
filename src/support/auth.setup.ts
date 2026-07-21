import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Auth Setup (template core)
 *
 * Official Playwright pattern: project `setup` materializes storage state under `.auth/`.
 * Generated authenticated specs override via:
 *   test.use({ storageState: '.auth/<role>.json' })
 *
 * Safe defaults for the template kit (no guaranteed target app):
 * - Missing credentials → write empty storage state and skip UI login (demos stay green).
 * - Credentials present → generic form login, then save storage state.
 * - Login failure → empty storage + warning (does not hard-fail the whole suite).
 *
 * Multi-role files (finance, hrd, …) are produced by `npm run setup:wizard` / `env:edit`.
 *
 * Run: npx playwright test src/support/auth.setup.ts --project=setup
 */

const AUTH_DIR = '.auth';
const USER_AUTH_FILE = path.join(AUTH_DIR, 'user.json');

function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

function writeEmptyStorageState(filePath: string): void {
  ensureAuthDir();
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    } catch {
      // non-fatal
    }
  }
  fs.writeFileSync(filePath, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
}

function resolveUserCredentials(): { email: string; password: string } | null {
  const email = (process.env.TEST_USER_EMAIL ?? process.env.USER_EMAIL ?? '').trim();
  const password = (process.env.TEST_USER_PASSWORD ?? process.env.USER_PASSWORD ?? '').trim();
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

function hasNonEmptyStorageState(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      cookies?: unknown[];
      origins?: unknown[];
    };
    const cookies = Array.isArray(parsed.cookies) ? parsed.cookies.length : 0;
    const origins = Array.isArray(parsed.origins) ? parsed.origins.length : 0;
    return cookies + origins > 0;
  } catch {
    return false;
  }
}

setup('authenticate:user', async ({ page, browser }) => {
  ensureAuthDir();

  const credentials = resolveUserCredentials();
  if (!credentials) {
    writeEmptyStorageState(USER_AUTH_FILE);
    console.log(
      'ℹ [Auth Setup] TEST_USER_EMAIL/PASSWORD not set — wrote empty .auth/user.json. ' +
        'Authenticated specs that need a real session must set credentials (npm run env:edit) ' +
        'or run setup:wizard. Demos and unauthenticated tests are unaffected.',
    );
    return;
  }

  const baseURL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const loginPath = process.env.AUTH_LOGIN_URL_PATH ?? '/login';
  const successPath = process.env.AUTH_SUCCESS_URL_PATH ?? '/dashboard';
  const loginUrl = loginPath.startsWith('http')
    ? loginPath
    : `${baseURL}${loginPath.startsWith('/') ? '' : '/'}${loginPath}`;
  const successUrlFragment = successPath.replace(/^\//, '');

  // Reuse session if storage state looks valid and success URL does not bounce to login
  if (hasNonEmptyStorageState(USER_AUTH_FILE)) {
    const context = await browser.newContext({ storageState: USER_AUTH_FILE });
    const probe = await context.newPage();
    try {
      await probe.goto(`${baseURL}/${successUrlFragment}`, { waitUntil: 'domcontentloaded' });
      const bouncedToLogin = probe
        .url()
        .toLowerCase()
        .includes(loginPath.toLowerCase().replace(/^\//, ''));
      if (!bouncedToLogin) {
        await context.storageState({ path: USER_AUTH_FILE });
        console.log('✔ [Auth Setup] Existing session still valid — refreshed .auth/user.json');
        await context.close();
        return;
      }
    } catch {
      console.log('⚠ [Auth Setup] Could not validate existing session — logging in again');
    } finally {
      await context.close().catch(() => undefined);
    }
  }

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  await page
    .locator(
      'input[type="email"], input[name="email"], input[name="username"], input[id*="email" i], input[id*="user" i]',
    )
    .first()
    .fill(credentials.email);

  await page
    .locator('input[type="password"], input[name="password"], input[id*="pass" i]')
    .first()
    .fill(credentials.password);

  await page
    .locator(
      'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Masuk"), button:has-text("Sign in"), button:has-text("Log in")',
    )
    .first()
    .click();

  try {
    await page.waitForURL(new RegExp(successUrlFragment, 'i'), { timeout: 20_000 });
    await page.context().storageState({ path: USER_AUTH_FILE });
    console.log('✔ [Auth Setup] Session saved to', USER_AUTH_FILE);
  } catch (error) {
    writeEmptyStorageState(USER_AUTH_FILE);
    console.warn(
      '⚠ [Auth Setup] Login did not reach success URL — wrote empty storage state. ' +
        'Fix selectors in src/support/auth.setup.ts or credentials. Detail:',
      error instanceof Error ? error.message : error,
    );
  }
});

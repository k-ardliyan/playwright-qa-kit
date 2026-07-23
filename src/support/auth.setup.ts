import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  authStatePath,
  authStateWritePath,
  ensureAuthDirForEnv,
  migrateLegacyAuthFiles,
} from './auth-paths';
import {
  parseRolesFromEnvMap,
  resolveLoginIdentifier,
  isRoleLoginReady,
  roleCredentialKeys,
  isPlaceholderBaseUrl,
  type RoleCredentialRef,
} from '../shared/utils/role-credentials';
import {
  handlePostLoginChallenge,
  resolveChallengeMode,
  isInteractiveChallengeMode,
  resolveChallengeTimeoutMs,
} from './human-challenge';

/**
 * Auth Setup — multi-role discovery
 *
 * Discovers every login-ready role from process.env (TEST_USER_*, FINANCE_*, …)
 * and materializes `.auth/{APP_ENV}/{role}.json` for each.
 *
 * - Role **user** = default account for pipeline mode "general" (not a role named general).
 * - Login id: LOGIN_ID_PREF → EMAIL → USERNAME → PHONE
 * - If no role is login-ready, writes empty storage for `user` so unauthenticated demos still run.
 *
 * Run: npm run auth:setup
 *      npm run auth:setup:headed   # OTP/CAPTCHA browser
 */

function ensureAuthDir(): void {
  ensureAuthDirForEnv();
}

function writeEmptyStorageState(filePath: string): void {
  ensureAuthDir();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    } catch {
      // non-fatal
    }
  }
  fs.writeFileSync(filePath, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
}

function envMap(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((e): e is [string, string] => typeof e[1] === 'string'),
  );
}

function resolveRoleLogin(ref: RoleCredentialRef): { loginId: string; password: string } | null {
  const map = envMap();
  if (!isRoleLoginReady(map, ref)) return null;
  const resolved = resolveLoginIdentifier(map, ref);
  if ('error' in resolved) return null;
  const password = (map[ref.passwordKey] ?? '').trim();
  if (!password) return null;
  return { loginId: resolved.value, password };
}

function hasNonEmptyStorageState(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
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

function loginPaths(): {
  baseURL: string;
  loginPath: string;
  loginUrl: string;
  successUrlFragment: string;
} {
  const baseURL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const loginPath = process.env.AUTH_LOGIN_URL_PATH ?? '/login';
  const successPath = process.env.AUTH_SUCCESS_URL_PATH ?? '/dashboard';
  const loginUrl = loginPath.startsWith('http')
    ? loginPath
    : `${baseURL}${loginPath.startsWith('/') ? '' : '/'}${loginPath}`;
  const successUrlFragment = successPath.replace(/^\//, '');
  return { baseURL, loginPath, loginUrl, successUrlFragment };
}

/** Prefer login-ready roles; if none, still emit empty user storage. */
function rolesToAuthenticate(): RoleCredentialRef[] {
  const map = envMap();
  const discovered = parseRolesFromEnvMap(map).filter((r) => isRoleLoginReady(map, r));
  if (discovered.length > 0) return discovered;
  return [roleCredentialKeys('user')];
}

// One-time legacy migration before any setup() registration
migrateLegacyAuthFiles();

const roles = rolesToAuthenticate();

for (const ref of roles) {
  const readPath = authStatePath(ref.name);
  const writePath = authStateWritePath(ref.name);

  setup(`authenticate:${ref.name}`, async ({ page, browser }) => {
    ensureAuthDir();

    const credentials = resolveRoleLogin(ref);
    if (!credentials) {
      writeEmptyStorageState(writePath);
      console.log(
        `ℹ [Auth Setup] ${ref.name}: not login-ready — wrote empty storage. ` +
          `Set ${ref.passwordKey} + ≥1 of EMAIL/USERNAME/PHONE (npm run env:edit).`,
      );
      return;
    }

    const { baseURL, loginPath, loginUrl, successUrlFragment } = loginPaths();

    if (isPlaceholderBaseUrl(baseURL)) {
      const msg =
        `[Auth Setup] ${ref.name}: BASE_URL is missing or still a kit placeholder ` +
        `(${baseURL}). Set a real BASE_URL in environments/{APP_ENV}.env or CI secrets.`;
      if (process.env.CI === 'true') {
        throw new Error(msg);
      }
      writeEmptyStorageState(writePath);
      console.warn(`⚠ ${msg} — wrote empty storage.`);
      return;
    }

    if (hasNonEmptyStorageState(readPath)) {
      const context = await browser.newContext({ storageState: readPath });
      const probe = await context.newPage();
      try {
        await probe.goto(`${baseURL}/${successUrlFragment}`, { waitUntil: 'domcontentloaded' });
        const bouncedToLogin = probe
          .url()
          .toLowerCase()
          .includes(loginPath.toLowerCase().replace(/^\//, ''));
        if (!bouncedToLogin) {
          ensureAuthDir();
          await context.storageState({ path: writePath });
          console.log('✔ [Auth Setup] Existing session still valid — refreshed', writePath);
          await context.close();
          return;
        }
      } catch {
        console.log(`⚠ [Auth Setup] ${ref.name}: could not validate session — logging in again`);
      } finally {
        await context.close().catch(() => undefined);
      }
    }

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    await page
      .locator(
        'input[type="email"], input[name="email"], input[name="username"], input[name="phone"], input[id*="email" i], input[id*="user" i], input[id*="phone" i]',
      )
      .first()
      .fill(credentials.loginId);

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

    ensureAuthDir();

    const challengeMode = resolveChallengeMode();
    const successTimeout = isInteractiveChallengeMode(challengeMode)
      ? resolveChallengeTimeoutMs()
      : 20_000;

    try {
      const detected = await handlePostLoginChallenge(page, { mode: challengeMode });
      if (detected !== 'none') {
        console.log(`ℹ [Auth Setup] ${ref.name}: post-login challenge handled (${detected})`);
      }

      await page.waitForURL(new RegExp(successUrlFragment, 'i'), { timeout: successTimeout });
      await page.context().storageState({ path: writePath });
      console.log('✔ [Auth Setup] Session saved to', writePath);
    } catch (error) {
      const detail = error instanceof Error ? error.message : error;
      // Interactive challenge modes: fail the setup test (do not hide as empty storage)
      if (isInteractiveChallengeMode(challengeMode)) {
        console.error(
          `✖ [Auth Setup] ${ref.name}: assisted login failed (AUTH_CHALLENGE_MODE=${challengeMode}).`,
          detail,
        );
        throw error instanceof Error ? error : new Error(String(detail));
      }
      writeEmptyStorageState(writePath);
      console.warn(
        `⚠ [Auth Setup] ${ref.name}: login did not reach success URL — wrote empty storage. ` +
          'Fix selectors, credentials, or AUTH_CHALLENGE_MODE (otp-browser / captcha-browser). Detail:',
        detail,
      );
    }
  });
}

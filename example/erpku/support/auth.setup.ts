import { test as setup, expect } from '@playwright/test';
import { env } from '@/shared/utils/env';
import { LoginPage } from '@erpku/pages/ui/LoginPage';
import fs from 'node:fs';
import {
  authStatePath,
  authStateWritePath,
  ensureAuthDirForEnv,
  migrateLegacyAuthFiles,
} from '../../../src/support/auth-paths';

function requireAuthEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[Auth Setup] Missing ${name}. Set it in environments/{APP_ENV}.env. ` +
        'See example/erpku/environments/erpku.env.example for ERPKU reference values.',
    );
  }
  return value;
}

/**
 * ERPKU adapter auth setup — session refresh + UI login via LoginPage POM.
 * Storage: `.auth/{APP_ENV}/user.json` (legacy `.auth/user.json` migrated once).
 * Login id: resolve via env.getRoleLoginId('user') when possible (email|username|phone).
 */
setup('authenticate:user', async ({ page, playwright }) => {
  migrateLegacyAuthFiles();
  ensureAuthDirForEnv();

  const readPath = authStatePath('user');
  const writePath = authStateWritePath('user');

  const successUrlPath = requireAuthEnv('AUTH_SUCCESS_URL_PATH', env.AUTH_SUCCESS_URL_PATH);
  const loginUrlPath = requireAuthEnv('AUTH_LOGIN_URL_PATH', env.AUTH_LOGIN_URL_PATH);
  const successText = requireAuthEnv('AUTH_SUCCESS_TEXT', env.AUTH_SUCCESS_TEXT);

  if (fs.existsSync(readPath)) {
    try {
      const apiContext = await playwright.request.newContext({
        storageState: readPath,
      });

      const response = await apiContext.get(env.BASE_URL + successUrlPath);

      if (response.ok() && !response.url().includes(loginUrlPath)) {
        await apiContext.storageState({ path: writePath });
        console.log('✔ [Auth Setup] Sesi terbukti aktif di server. Melewati login UI.', writePath);
        await apiContext.dispose();
        return;
      }
      await apiContext.dispose();
      console.log(
        '⚠ [Auth Setup] Sesi ditemukan tapi sudah tidak aktif di server. Melakukan login ulang...',
      );
    } catch (error) {
      console.log(
        '⚠ [Auth Setup] Gagal memverifikasi sesi aktif:',
        error,
        '. Melakukan login ulang...',
      );
    }
  } else {
    console.log('ℹ [Auth Setup] File sesi lokal tidak ditemukan. Melakukan login awal...');
  }

  let loginId: string;
  let password: string;
  try {
    loginId = env.getRoleLoginId('user');
    password = env.getRolePassword('user');
  } catch {
    // Fallback for older env with only USER_EMAIL/PASSWORD accessors
    loginId = env.USER_EMAIL;
    password = env.USER_PASSWORD;
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.doLogin(loginId, password, false);

  await expect(page).toHaveURL(new RegExp(successUrlPath, 'i'), { timeout: 20_000 });
  await expect(page.getByText(successText, { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.context().storageState({ path: writePath });
  console.log('✔ [Auth Setup] Session saved to', writePath);
});

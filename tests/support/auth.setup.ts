import { test as setup, expect } from '@playwright/test';
import { env } from '../utils/env';

const authFile = '.auth/user.json';

/**
 * Auth Setup — login sekali, simpan state untuk seluruh test suite.
 *
 * Port dari Python conftest.py:
 * - _do_fresh_login() → login via form UI
 * - _save_auth_state() → storageState ke file
 *
 * Playwright akan skip setup jika authFile sudah ada dan valid.
 * Hapus .auth/ folder untuk force re-login.
 */
setup('authenticate', async ({ page }) => {
  // ── Navigate ke login page ─────────────────────────────────────────
  await page.goto(env.BASE_URL);

  // ── Isi form login ─────────────────────────────────────────────────
  // Multi-fallback locator sesuai Python LoginPage
  const usernameInput = page.locator(
    "input[name='username'], input[name='email'], input[type='email']",
  );
  const passwordInput = page.locator("input[name='password'], input[type='password']");
  const loginButton = page.getByRole('button', { name: /Login|Masuk|Sign In/i });

  await usernameInput.first().fill(env.USER_EMAIL);
  await passwordInput.first().fill(env.USER_PASSWORD);
  await loginButton.click();

  // ── Tunggu redirect ke dashboard ───────────────────────────────────
  await page.waitForURL(/dashboard/i, { timeout: 15_000 });

  // ── Verify login berhasil ──────────────────────────────────────────
  // Sesuai Python DashboardPage.expect_to_be_loaded():
  // - URL contains "dashboard"
  // - Toast "Berhasil Login" visible
  // - Heading "Dashboard" visible
  await expect(page.getByText('Berhasil Login')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Dashboard').first()).toBeVisible();

  // ── Simpan auth state ──────────────────────────────────────────────
  await page.context().storageState({ path: authFile });
});

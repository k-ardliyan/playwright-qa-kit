import { test as setup, expect } from '@playwright/test';
import { env } from '../utils/env';
import fs from 'fs';

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
setup('authenticate', async ({ page, playwright }) => {
  // ── Pengecekan Sesi Aktif via Request Context ──────────────
  if (fs.existsSync(authFile)) {
    try {
      // Buat APIRequestContext dengan memuat cookies yang tersimpan sebelumnya
      const apiContext = await playwright.request.newContext({
        storageState: authFile,
      });

      // Lakukan HEADLESS request ke dashboard untuk verifikasi sesi terautentikasi
      const response = await apiContext.get(env.BASE_URL + '/dashboard');

      // Jika server mengembalikan status sukses (200) dan tidak mengarah ke halaman login
      if (response.ok() && !response.url().includes('login')) {
        console.log('✔ [Auth Setup] Sesi terbukti aktif di server. Melewati login UI.');
        return;
      }
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

  // ── Navigate ke login page ─────────────────────────────────────────
  await page.goto(env.BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // ── Isi form login ─────────────────────────────────────────────────
  // Multi-fallback locator sesuai Python LoginPage
  const usernameInput = page
    .locator("input[name='username'], input[name='email'], input[type='email']")
    .first();
  const passwordInput = page.locator("input[name='password'], input[type='password']").first();
  const loginButton = page.getByRole('button', { name: /Login|Masuk|Sign In/i });

  // Tunggu input fields ready & visible
  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  // Isi dengan aman & focus untuk trigger input framework events
  await usernameInput.fill(env.USER_EMAIL);
  await passwordInput.fill(env.USER_PASSWORD);
  await passwordInput.focus();

  // Kirim login
  await loginButton.click();

  // ── Tunggu redirect ke dashboard dengan Web-First Assertion ────────
  await expect(page).toHaveURL(/dashboard/i, { timeout: 20_000 });

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

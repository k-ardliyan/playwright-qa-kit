import { test, expect } from '@/fixtures/base.fixture';

test.describe('Dashboard Page Suite', { tag: ['@dashboard'] }, () => {
  // Test ini secara default mewarisi storageState ter-autentikasi dari setup project

  test('TC-DASH-001: should display dashboard main elements successfully', async ({
    page,
    dashboardPage,
  }) => {
    // Navigate ke dashboard
    await page.goto('/dashboard');

    // Pastikan tombol profil visible
    await expect(dashboardPage.btnProfile).toBeVisible();
    // Pastikan tulisan header dashboard visible
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('TC-DASH-002: should log out successfully from dashboard', async ({
    page,
    dashboardPage,
  }) => {
    await page.goto('/dashboard');

    // Lakukan logout
    await dashboardPage.doLogout();

    // Pastikan ter-redirect ke halaman login/root luar
    await expect(page).not.toHaveURL(/.*\/dashboard/);
    await expect(page).toHaveURL(/.*(login|\/)/);
  });
});

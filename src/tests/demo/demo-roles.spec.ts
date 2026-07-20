import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';

/**
 * Demo Role-Aware Tests
 *
 * Simulates a multi-role QA scenario:
 *   - finance  : akses invoice & laporan keuangan
 *   - hrd      : akses data karyawan
 *   - super-admin : akses semua fitur + pengaturan
 *
 * Semua test dummy — menggunakan playwright.dev sebagai target netral.
 * Tujuan: memastikan Table View & dashboard role-aware bekerja dengan benar.
 */

// ---------------------------------------------------------------------------
// Role: finance
// ---------------------------------------------------------------------------

test.describe('Finance — Invoice Access', { tag: ['@demo', '@role', '@finance'] }, () => {
  test('TC-FIN-01: should view invoice list page', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-FIN-01',
      priority: 'HIGH',
      role: 'finance',
      affectedLayer: ['FE', 'BE'],
      expectedResult: 'Halaman daftar invoice terbuka dan menampilkan data',
      inputData: { user: 'finance@demo.test', menu: 'Invoice', action: 'view list' },
    });

    await test.step('Navigate to Playwright docs (dummy finance page)', async () => {
      await page.goto('https://playwright.dev/docs/intro');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Halaman docs terbuka — simulasi invoice list berhasil');
    });

    await test.step('Verify page content visible', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
    });
  });

  test('TC-FIN-02: should filter invoice by date range', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-FIN-02',
      priority: 'MEDIUM',
      role: 'finance',
      affectedLayer: ['FE', 'API'],
      expectedResult: 'Filter tanggal menampilkan invoice sesuai range',
      inputData: { dateFrom: '2026-01-01', dateTo: '2026-06-30', expectedCount: '>0' },
    });

    await test.step('Navigate and open search (dummy filter)', async () => {
      await page.goto('https://playwright.dev/');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.getByPlaceholder('Search docs').fill('assertions');
    });

    await test.step('Verify filter results visible', async () => {
      const firstResult = page.locator('.DocSearch-Hit').first();
      await expect(firstResult).toBeVisible();
      captureActualResult('Filter berhasil — hasil filter terlihat');
    });
  });

  test('TC-FIN-03: should fail to access HR payroll menu', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-FIN-03',
      priority: 'HIGH',
      role: 'finance',
      affectedLayer: ['FE', 'BE'],
      expectedResult: 'Menu payroll tidak muncul untuk role finance',
      inputData: { user: 'finance@demo.test', menu: 'Payroll', action: 'access' },
    });

    await test.step('Navigate to page', async () => {
      await page.goto('https://playwright.dev/');
    });

    await test.step('Try to click non-existent Payroll menu (intentional fail)', async () => {
      // Simulated: finance tidak punya akses ke menu ini — element tidak ada
      await page.getByRole('link', { name: 'Payroll Management' }).click({ timeout: 4000 });
    });
  });
});

// ---------------------------------------------------------------------------
// Role: hrd
// ---------------------------------------------------------------------------

test.describe('HRD — Employee Data Access', { tag: ['@demo', '@role', '@hrd'] }, () => {
  test('TC-HRD-01: should view employee list', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-HRD-01',
      priority: 'HIGH',
      role: 'hrd',
      affectedLayer: ['FE', 'BE', 'DB'],
      expectedResult: 'Daftar karyawan terbuka dengan data lengkap',
      inputData: { user: 'hrd@demo.test', menu: 'Employees', action: 'view list' },
    });

    await test.step('Navigate to employee list (dummy)', async () => {
      await page.goto('https://playwright.dev/docs/test-fixtures');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Halaman employee list terbuka — data karyawan tampil');
    });

    await test.step('Verify table/list structure exists', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
    });
  });

  test('TC-HRD-02: should search employee by name', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-HRD-02',
      priority: 'MEDIUM',
      role: 'hrd',
      affectedLayer: ['FE', 'API'],
      expectedResult: 'Pencarian nama karyawan menampilkan hasil yang relevan',
      inputData: { searchQuery: 'Budi Santoso', expectedResult: '1 employee found' },
    });

    await test.step('Open search bar', async () => {
      await page.goto('https://playwright.dev/');
      await page.getByRole('button', { name: 'Search' }).click();
    });

    await test.step('Search for employee name (dummy)', async () => {
      await page.getByPlaceholder('Search docs').fill('fixtures');
      const firstResult = page.locator('.DocSearch-Hit').first();
      await expect(firstResult).toBeVisible();
      captureActualResult('Pencarian berhasil — karyawan ditemukan');
    });
  });

  test('TC-HRD-03: should fail to access finance report', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-HRD-03',
      priority: 'MEDIUM',
      role: 'hrd',
      affectedLayer: ['FE'],
      expectedResult: 'Laporan keuangan tidak dapat diakses oleh HRD',
      inputData: { user: 'hrd@demo.test', menu: 'Financial Report', action: 'access' },
    });

    await test.step('Navigate to page', async () => {
      await page.goto('https://playwright.dev/');
    });

    await test.step('Try to access finance report menu (intentional fail)', async () => {
      // Simulated: HRD tidak punya akses ke laporan keuangan
      await page.getByRole('link', { name: 'Financial Report' }).click({ timeout: 4000 });
    });
  });
});

// ---------------------------------------------------------------------------
// Role: super-admin
// ---------------------------------------------------------------------------

test.describe('Super Admin — Full Access', { tag: ['@demo', '@role', '@super-admin'] }, () => {
  test('TC-SA-01: should access system settings', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-SA-01',
      priority: 'HIGH',
      role: 'super-admin',
      affectedLayer: ['FE', 'BE', 'DB'],
      expectedResult: 'Halaman pengaturan sistem terbuka dengan semua menu tersedia',
      inputData: { user: 'superadmin@demo.test', menu: 'Settings', action: 'view' },
    });

    await test.step('Navigate to settings (dummy)', async () => {
      await page.goto('https://playwright.dev/docs/api/class-page');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Settings page terbuka — semua menu tersedia untuk super-admin');
    });

    await test.step('Verify full menu access', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
    });
  });

  test('TC-SA-02: should manage user roles', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-SA-02',
      priority: 'HIGH',
      role: 'super-admin',
      affectedLayer: ['FE', 'BE', 'DB'],
      expectedResult: 'Super admin dapat mengubah role pengguna',
      inputData: { targetUser: 'finance@demo.test', newRole: 'hrd', action: 'role change' },
    });

    await test.step('Navigate to user management', async () => {
      await page.goto('https://playwright.dev/docs/api/class-locator');
      await expect(page).toHaveTitle(/Playwright/);
    });

    await test.step('Verify user management accessible', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
      captureActualResult('User management terbuka — role berhasil diubah');
    });
  });

  test('TC-SA-03: should view audit log', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-SA-03',
      priority: 'MEDIUM',
      role: 'super-admin',
      affectedLayer: ['FE', 'BE', 'DB'],
      expectedResult: 'Audit log menampilkan semua aktivitas sistem',
      inputData: { user: 'superadmin@demo.test', menu: 'Audit Log', filter: 'last 7 days' },
    });

    await test.step('Navigate to audit log', async () => {
      await page.goto('https://playwright.dev/docs/api/class-browser');
      await expect(page).toHaveTitle(/Playwright/);
    });

    await test.step('Verify audit log content', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
      captureActualResult('Audit log terbuka — semua aktivitas terlihat');
    });
  });

  test('TC-SA-04: should export system report', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-SA-04',
      priority: 'LOW',
      role: 'super-admin',
      affectedLayer: ['FE', 'BE'],
      expectedResult: 'Laporan sistem berhasil diekspor dalam format PDF',
      inputData: { reportType: 'system summary', format: 'PDF', dateRange: 'last 30 days' },
    });

    await test.step('Navigate to report export', async () => {
      await page.goto('https://playwright.dev/docs/api/class-download');
      await expect(page).toHaveTitle(/Playwright/);
    });

    await test.step('Verify export UI available', async () => {
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
      captureActualResult('Export UI tersedia — laporan berhasil diekspor');
    });
  });
});

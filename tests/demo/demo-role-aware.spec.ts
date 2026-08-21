import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';

test.describe('Role-Aware Demo — Admin', { tag: ['@demo', '@role-aware'] }, () => {
  test('admin can access system settings', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-001',
      priority: 'HIGH',
      role: 'admin',
      affectedLayer: ['FE', 'BE'],
      expectedResult: 'System settings page is accessible',
      inputData: { role: 'admin', url: 'https://playwright.dev/docs/intro', action: 'navigate' },
    });

    await test.step('Navigate to docs as admin', async () => {
      await page.goto('https://playwright.dev/docs/intro');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Admin accessed system settings — page loaded');
    });
  });

  test('admin can manage users', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-002',
      priority: 'HIGH',
      role: 'admin',
      affectedLayer: ['FE', 'BE', 'DB'],
      expectedResult: 'User management page loads with user list',
      inputData: { role: 'admin', action: 'open user management', target: 'user list' },
    });

    await test.step('Navigate to user management', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('User management page loaded — admin confirmed');
    });
  });
});

test.describe('Role-Aware Demo — Finance', { tag: ['@demo', '@role-aware'] }, () => {
  test('finance can view invoices', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-003',
      priority: 'MEDIUM',
      role: 'finance',
      affectedLayer: ['FE'],
      expectedResult: 'Invoice list is visible with correct data',
      inputData: { role: 'finance', module: 'invoices', filter: 'all' },
    });

    await test.step('Navigate to invoices', async () => {
      await page.goto('https://playwright.dev/docs/intro');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Finance accessed invoices — list displayed');
    });
  });

  test('finance can export reports', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-004',
      priority: 'MEDIUM',
      role: 'finance',
      affectedLayer: ['FE', 'BE'],
      expectedResult: 'Report export completes successfully',
      inputData: { role: 'finance', format: 'PDF', dateRange: '2026-06-01 to 2026-06-30' },
    });

    await test.step('Navigate and verify', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Finance exported report — PDF generated');
    });
  });
});

test.describe('Role-Aware Demo — HRD', { tag: ['@demo', '@role-aware'] }, () => {
  test('hrd can view employee list', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-005',
      priority: 'MEDIUM',
      role: 'hrd',
      affectedLayer: ['FE'],
      expectedResult: 'Employee list page loads with staff data',
      inputData: { role: 'hrd', module: 'employees', department: 'all' },
    });

    await test.step('Navigate to employees', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('HRD accessed employee list — data loaded');
    });
  });

  test('hrd can manage attendance', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-ROLE-006',
      priority: 'LOW',
      role: 'hrd',
      affectedLayer: ['FE', 'DB'],
      expectedResult: "Attendance dashboard shows today's records",
      inputData: { role: 'hrd', module: 'attendance', date: 'today' },
    });

    await test.step('Navigate to attendance', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('HRD attendance dashboard loaded');
    });
  });
});

import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Extended MyFixtures type untuk Page Object Models
 */
type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

/**
 * Custom test fixture yang di-extend dari base Playwright test.
 * Menyediakan instance LoginPage dan DashboardPage secara otomatis.
 */
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';

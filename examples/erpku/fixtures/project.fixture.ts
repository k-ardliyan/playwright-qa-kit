import { test as base } from '@playwright/test';
import { LoginPage } from '@erpku/pages/ui/LoginPage';
import { DashboardPage } from '@erpku/pages/ui/DashboardPage';
import { CustomersAllPage } from '@erpku/pages/customers/CustomersAllPage';
import { CustomersNewPage } from '@erpku/pages/customers/CustomersNewPage';
import { CustomersEditPage } from '@erpku/pages/customers/CustomersEditPage';
import { CustomersGroupPage } from '@erpku/pages/customers/CustomersGroupPage';
import { CustomersDetailPage } from '@erpku/pages/customers/CustomersDetailPage';

/**
 * ERPKU project fixtures — registers POMs for the reference adapter.
 */
export type ProjectFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  customersAllPage: CustomersAllPage;
  customersNewPage: CustomersNewPage;
  customersEditPage: CustomersEditPage;
  customersGroupPage: CustomersGroupPage;
  customersDetailPage: CustomersDetailPage;
};

export const projectTest = base.extend<ProjectFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  customersAllPage: async ({ page }, use) => {
    await use(new CustomersAllPage(page));
  },
  customersNewPage: async ({ page }, use) => {
    await use(new CustomersNewPage(page));
  },
  customersEditPage: async ({ page }, use) => {
    await use(new CustomersEditPage(page));
  },
  customersGroupPage: async ({ page }, use) => {
    await use(new CustomersGroupPage(page));
  },
  customersDetailPage: async ({ page }, use) => {
    await use(new CustomersDetailPage(page));
  },
});

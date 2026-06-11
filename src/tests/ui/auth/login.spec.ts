import { test, expect } from '@/fixtures/base.fixture';
import { env } from '@/shared/utils/env';
import users from '@/shared/mock-data/login.data.json';

test.describe('Login Scenario Suite', { tag: ['@auth', '@login'] }, () => {
  // Reset storageState agar pengetesan login selalu berjalan dalam state unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  // ── DATA-DRIVEN TESTING (DDT) UNTUK KEBERHASILAN LOGIN ───────────────────
  const successScenarios = [
    { id: 'TC-LOGIN-001a', type: 'Email', getCredential: () => env.USER_EMAIL },
    { id: 'TC-LOGIN-001b', type: 'Username', getCredential: () => env.USER_USERNAME },
    { id: 'TC-LOGIN-001c', type: 'Phone Number', getCredential: () => env.USER_PHONE },
  ];

  successScenarios.forEach((scenario) => {
    const credential = scenario.getCredential();
    if (!credential) {
      return;
    }

    test(`${scenario.id}: should login successfully with ${scenario.type}`, async ({
      loginPage,
      dashboardPage,
    }) => {
      await test.step(`Login using ${scenario.type} credential`, async () => {
        await loginPage.goto();
        await loginPage.doLogin(credential, env.USER_PASSWORD, true);

        // Verify redirect dan elemen dashboard tampil
        await dashboardPage.expectToBeLoaded();
      });
    });
  });

  // ── DATA-DRIVEN TESTING (DDT) UNTUK KEGAGALAN LOGIN ───────────────────────
  users.failureScenarios.forEach((data) => {
    // Resolusi dinamis untuk username diselesaikan di luar cakupan fungsi test() untuk mematuhi aturan ESLint
    const resolvedUsername =
      data.usernameSource === 'TEST_USER_EMAIL' ? env.USER_EMAIL : (data.username ?? '');

    test(`${data.caseId}: should fail login with ${data.description}`, async ({
      page,
      loginPage,
    }) => {
      await test.step('Attempt login with invalid credential set', async () => {
        await loginPage.goto();
        await loginPage.doLogin(resolvedUsername, data.password);

        // Verifikasi kemunculan pesan error/validasi sesuai ekspektasi dataset
        for (const errorPattern of data.expectedErrors) {
          const errorElement = page.getByText(new RegExp(errorPattern, 'i'));
          await expect(errorElement).toBeVisible();
        }

        // Pastikan URL tidak bergeser ke dashboard
        await expect(page).not.toHaveURL(/.*\/dashboard/);
      });
    });
  });
});

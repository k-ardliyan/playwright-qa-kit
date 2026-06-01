import { test, expect } from '../../fixtures/base.fixture';
import { env } from '../../utils/env';
import users from '../../data/users.json';

test.describe('Login Scenario Suite @auth @login', () => {
  // Reset storageState agar pengetesan login selalu berjalan dalam state unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-LOGIN-001: should login successfully with Remember Me', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, env.USER_PASSWORD, true);

    // Verify redirect dan elemen dashboard tampil
    await dashboardPage.expectToBeLoaded();
  });

  test('TC-LOGIN-002: should fail login with incorrect password', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, users.invalidPassword.password);

    // Verify Toast error muncul
    const toastError = page.getByText(
      /Nama akun atau kata sandi salah|Invalid credentials|Wrong email or password/i,
    );
    await expect(toastError).toBeVisible();

    // Pastikan url tidak bergeser ke dashboard
    await expect(page).not.toHaveURL(/.*\/dashboard/);
  });

  test('TC-LOGIN-003: should show validation helper when username is empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin('', users.invalidPassword.password);

    // Verify helper text muncul
    const helperText = page.getByText(
      /username harus diisi|email is required|username is required/i,
    );
    await expect(helperText).toBeVisible();
  });

  test('TC-LOGIN-004: should show validation helper when password is empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin(env.USER_EMAIL, '');

    // Verify helper text muncul
    const helperText = page.getByText(/password harus diisi|password is required/i);
    await expect(helperText).toBeVisible();
  });

  test('TC-LOGIN-005: should show validations when both credentials are empty', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.doLogin('', '');

    // Verify kedua helper text muncul
    const helperUser = page.getByText(
      /username harus diisi|email is required|username is required/i,
    );
    const helperPass = page.getByText(/password harus diisi|password is required/i);
    await expect(helperUser).toBeVisible();
    await expect(helperPass).toBeVisible();
  });
});

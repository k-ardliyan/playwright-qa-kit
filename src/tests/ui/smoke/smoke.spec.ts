import { test, expect } from '@/fixtures/base.fixture';

test.describe('Smoke Tests', { tag: ['@smoke'] }, () => {
  // Reset storageState agar smoke tests berjalan unauthenticated dan tidak redirect ke dashboard
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should return valid HTTP response from server', async ({ request }) => {
    await test.step('Request root endpoint and verify successful response', async () => {
      // Verify server is reachable and responds with success status
      const response = await request.get('/');
      await expect(response).toBeOK();
      expect(response.status()).toBeLessThan(400);
    });
  });

  test('should load the application landing page', async ({ loginPage }) => {
    await test.step('Open landing page and check basic page health indicators', async () => {
      await loginPage.goto();

      // Verify page title is not empty
      const title = await loginPage.page.title();
      expect(title).toBeTruthy();

      // Verify the page is not a server error page
      const bodyText = await loginPage.page.locator('body').textContent();
      expect(bodyText).not.toContain('502 Bad Gateway');
      expect(bodyText).not.toContain('503 Service Unavailable');
      expect(bodyText).not.toContain('Cannot GET /');
    });
  });

  test('should display login form elements on landing page', async ({ loginPage }) => {
    await test.step('Verify login form controls are visible', async () => {
      await loginPage.goto();

      // Verify email/username input field is visible
      await expect(loginPage.inputUsername.first()).toBeVisible();

      // Verify password input field is visible
      await expect(loginPage.inputPassword.first()).toBeVisible();

      // Verify login button is visible
      await expect(loginPage.btnLogin).toBeVisible();
    });
  });
});

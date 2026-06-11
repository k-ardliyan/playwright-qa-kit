import { test, expect } from '@/fixtures/base.fixture';

/**
 * Seed test — bootstrap for Planner/Generator agents.
 * Runs with project dependencies (auth setup) and demonstrates fixture usage.
 */
test.describe('Seed', { tag: ['@seed'] }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('seed', async ({ loginPage, page }) => {
    await test.step('Open login page as unauthenticated entry point', async () => {
      await loginPage.goto();
      await expect(page).toHaveURL(/login/i);
    });
  });
});

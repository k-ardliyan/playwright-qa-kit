import { test, expect } from '@/fixtures/base.fixture';

/**
 * Seed test — bootstrap for Planner/Generator agents.
 * Generic entry point: opens BASE_URL without project-specific POM fixtures.
 */
test.describe('Seed', { tag: ['@seed'] }, () => {
  test('seed', async ({ page }) => {
    await test.step('Open BASE_URL as generic bootstrap entry point', async () => {
      await page.goto(process.env.BASE_URL ?? '/');
      await expect(page).toHaveURL(/.+/);
    });
  });
});

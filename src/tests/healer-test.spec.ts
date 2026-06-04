import { test } from '@/fixtures/base.fixture';

test.describe('Healer Tests', () => {
  test('Healer test fail', async ({ page }) => {
    await test.step('Navigate to playwright.dev and try to click non-existent button', async () => {
      await page.goto('https://playwright.dev/');
      await page.click('text=ButtonGakAda');
    });
  });
});

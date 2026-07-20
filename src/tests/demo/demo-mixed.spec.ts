import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';

test.describe('Demo Mixed Results', { tag: ['@demo', '@mixed'] }, () => {
  test('should pass - verify page title', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-DEMO-03',
      priority: 'HIGH',
      affectedLayer: ['FE'],
      expectedResult: 'Docs page title contains "Installation | Playwright"',
      inputData: {
        url: 'https://playwright.dev/docs/intro',
        expected: 'Installation | Playwright',
      },
    });

    await test.step('Navigate to docs', async () => {
      await page.goto('https://playwright.dev/docs/intro');
      await expect(page).toHaveTitle(/Installation | Playwright/);
      captureActualResult('Page title confirmed — "Installation | Playwright"');
    });
  });

  test('should fail - intentional timeout error', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-DEMO-04',
      priority: 'LOW',
      affectedLayer: ['FE'],
      expectedResult: 'Button "Download Now" should be clickable',
      inputData: { url: 'https://playwright.dev/', button: 'Download Now', timeout: '5000ms' },
    });

    await test.step('Navigate to homepage', async () => {
      await page.goto('https://playwright.dev/');
    });

    await test.step('Try to click non-existent "Download Now" button', async () => {
      // This will fail with timeout — element doesn't exist
      await page.getByRole('button', { name: 'Download Now' }).click({ timeout: 5000 });
    });
  });
});

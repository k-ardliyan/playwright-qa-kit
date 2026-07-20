import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';

test.describe('Demo Success Tests', { tag: ['@demo', '@success'] }, () => {
  test('should navigate to Playwright homepage', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-DEMO-01',
      priority: 'HIGH',
      affectedLayer: ['FE'],
      expectedResult: 'Homepage loads with correct title and Get Started button visible',
      inputData: { url: 'https://playwright.dev/', action: 'navigate' },
    });

    await test.step('Open homepage', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      captureActualResult('Homepage loaded — title contains "Playwright"');
    });

    await test.step('Verify Get Started button exists', async () => {
      const getStartedBtn = page.getByRole('link', { name: 'Get started' });
      await expect(getStartedBtn).toBeVisible();
    });
  });

  test('should search for coding agent and open documentation', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-DEMO-05',
      priority: 'HIGH',
      affectedLayer: ['FE'],
      expectedResult: 'Documentation page for coding agent is displayed',
      inputData: {
        keyword: 'coding agent',
        target: 'documentation page',
        searchbar: 'Search docs',
      },
    });

    await test.step('Navigate to homepage', async () => {
      await page.goto('https://playwright.dev/');
    });

    await test.step('Open search and type keyword', async () => {
      await page.getByRole('button', { name: 'Search' }).click();
      await page.getByPlaceholder('Search docs').fill('coding agent');
    });

    await test.step('Click first search result', async () => {
      const firstResult = page.locator('.DocSearch-Hit').first();
      await expect(firstResult).toBeVisible();
      await firstResult.click();
    });

    await test.step('Verify documentation page loaded', async () => {
      await expect(page).toHaveURL(/docs/);
      captureActualResult('Documentation page loaded — URL contains /docs');
    });
  });

  test('should search documentation for locators', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-DEMO-02',
      priority: 'MEDIUM',
      affectedLayer: ['FE'],
      expectedResult: 'Search returns relevant results for "locators"',
      inputData: { keyword: 'locators', target: 'documentation search', searchbar: 'Search docs' },
    });

    await test.step('Navigate and open search', async () => {
      await page.goto('https://playwright.dev/');
      await page.getByRole('button', { name: 'Search' }).click();
    });

    await test.step('Search for "locators"', async () => {
      await page.getByPlaceholder('Search docs').fill('locators');
      const firstResult = page.locator('.DocSearch-Hit').first();
      await expect(firstResult).toBeVisible();
      captureActualResult('Search results displayed — first hit visible');
    });
  });
});

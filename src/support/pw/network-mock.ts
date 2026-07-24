/**
 * Network mock helpers — thin wrappers around official Playwright `page.route`.
 *
 * Prefer these in generated `(@failure)` / `@network` scenarios instead of ad-hoc routes.
 * For **live** payload/response checks use `@network-assert` helpers in `network-assert.ts`
 * (`waitForApi`, `assertNetworkContract`) — do not overload this mock module.
 *
 * Reliability tip: if route events seem missing because the app uses a Service Worker
 * (or MSW), set in the test/project:
 *   test.use({ serviceWorkers: 'block' });
 * See https://playwright.dev/docs/network#missing-network-events-and-service-workers
 *
 * @see https://playwright.dev/docs/network
 * @see ./network-assert.ts
 */

import type { Page, Route } from '@playwright/test';

export async function mockJson(
  page: Page,
  urlGlob: string,
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Promise<void> {
  await page.route(urlGlob, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(body),
    });
  });
}

export async function mockServerError(
  page: Page,
  urlGlob: string,
  status = 500,
  body: unknown = { error: 'Internal Server Error' },
): Promise<void> {
  await mockJson(page, urlGlob, body, status);
}

export async function mockAbort(
  page: Page,
  urlGlob: string,
  errorCode: Parameters<Route['abort']>[0] = 'failed',
): Promise<void> {
  await page.route(urlGlob, async (route: Route) => {
    await route.abort(errorCode);
  });
}

export async function mockText(
  page: Page,
  urlGlob: string,
  body: string,
  status = 200,
  contentType = 'text/plain',
): Promise<void> {
  await page.route(urlGlob, async (route: Route) => {
    await route.fulfill({ status, contentType, body });
  });
}

/** Remove all routes registered on this page (ignore errors if none). */
export async function unmockAll(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

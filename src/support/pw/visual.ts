/**
 * Visual regression helpers — official `expect(locator).toHaveScreenshot`.
 *
 * Prefer scoped locators (card, table, dialog) over full-page screenshots.
 *
 * Update baselines intentionally:
 *   npx playwright test --update-snapshots path/to/spec.ts
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { expect, type Locator, type Page } from '@playwright/test';

export interface VisualOptions {
  /** Snapshot name (file stem). Defaults to Playwright auto name. */
  name?: string;
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
  timeout?: number;
}

function toExpectOptions(options?: VisualOptions) {
  if (!options) {
    return { animations: 'disabled' as const, caret: 'hide' as const };
  }
  const { name: _name, ...rest } = options;
  return {
    animations: 'disabled' as const,
    caret: 'hide' as const,
    ...rest,
  };
}

/** Screenshot assert on a locator (preferred — more stable than full page). */
export async function expectVisual(target: Locator, options?: VisualOptions): Promise<void> {
  if (options?.name) {
    await expect(target).toHaveScreenshot(options.name, toExpectOptions(options));
    return;
  }
  await expect(target).toHaveScreenshot(toExpectOptions(options));
}

/** Full-page screenshot — use sparingly (layout chrome / dynamic regions flake). */
export async function expectPageVisual(page: Page, options?: VisualOptions): Promise<void> {
  if (options?.name) {
    await expect(page).toHaveScreenshot(options.name, toExpectOptions(options));
    return;
  }
  await expect(page).toHaveScreenshot(toExpectOptions(options));
}

/**
 * Clock helpers — official Playwright `page.clock` for time-sensitive UI.
 *
 * Use for date pickers, countdown timers, "expires at" banners, etc.
 *
 * @see https://playwright.dev/docs/clock
 */

import type { Page } from '@playwright/test';

/** Install a fake clock at the given time (ISO string or Date). */
export async function freezeTime(page: Page, at: Date | string | number): Promise<void> {
  const time = at instanceof Date ? at : new Date(at);
  await page.clock.install({ time });
}

/** Jump the installed clock forward by milliseconds. */
export async function advanceTime(page: Page, ms: number): Promise<void> {
  await page.clock.fastForward(ms);
}

/** Set the clock to an absolute time without installing if already installed. */
export async function setTime(page: Page, at: Date | string | number): Promise<void> {
  const time = at instanceof Date ? at : new Date(at);
  await page.clock.setFixedTime(time);
}

/** Resume real timers (cleanup). */
export async function resumeRealTime(page: Page): Promise<void> {
  await page.clock.resume();
}

/**
 * Conditional download helpers — download templates only when preconditions are met.
 *
 * Common ERP pattern: download template only when master data exists,
 * or skip gracefully when the prerequisite is not satisfied.
 *
 * @module src/support/pw/conditional-download
 */

import type { Page } from '@playwright/test';
import { downloadAndSave } from './files';
import { test } from '@playwright/test';

export interface DownloadIfOptions {
  /** Skip instead of returning null — annotates test with skip reason */
  skipOnFalse?: boolean;
  /** Skip reason annotation for test metadata */
  skipReason?: string;
  /** Custom download directory */
  dir?: string;
}

export interface DownloadResult {
  path: string;
  suggestedFilename: string;
  size: number;
}

/**
 * Download template only when a precondition is met.
 * Returns null (skipped) if condition is not met — test can branch.
 *
 * @example
 * ```ts
 * const result = await downloadIf(
 *   page,
 *   async () => await masterDataExists(page),
 *   async () => page.click('button.download-template'),
 *   { skipOnFalse: true, skipReason: 'Master data not found' },
 * );
 * if (!result) return; // skipped
 * ```
 */
export async function downloadIf(
  page: Page,
  condition: () => Promise<boolean>,
  trigger: () => Promise<void>,
  options?: DownloadIfOptions,
): Promise<DownloadResult | null> {
  const conditionMet = await condition();

  if (!conditionMet) {
    if (options?.skipOnFalse) {
      const reason = options.skipReason ?? 'Download condition not met — skipped';
      test.skip(true, reason);
    }
    return null;
  }

  const { path, suggestedFilename, size } = await downloadAndSave(page, trigger, {
    dir: options?.dir,
  });

  return { path, suggestedFilename, size };
}

/**
 * Download template when master data exists (selector-based check).
 * Navigates to masterCheckUrl, verifies masterSelector is visible,
 * then triggers the download.
 *
 * Common ERP pattern: download employee template only when department master exists.
 *
 * @example
 * ```ts
 * const result = await downloadTemplateWithMaster(page, {
 *   masterCheckUrl: '/settings/departments',
 *   masterSelector: 'table.departments tbody tr',
 *   downloadTrigger: async () => page.click('button.download-template'),
 * });
 * ```
 */
export async function downloadTemplateWithMaster(
  page: Page,
  options: {
    /** Navigate here to check master data exists */
    masterCheckUrl: string;
    /** Selector that confirms master data is present (e.g. table row) */
    masterSelector: string;
    /** Trigger the download action */
    downloadTrigger: () => Promise<void>;
    /** Download directory */
    dir?: string;
    /** Skip test if master not found (default: false) */
    skipOnMissing?: boolean;
  },
): Promise<DownloadResult | null> {
  return downloadIf(
    page,
    async () => {
      await page.goto(options.masterCheckUrl);
      const locator = page.locator(options.masterSelector);
      const count = await locator.count();
      return count > 0;
    },
    options.downloadTrigger,
    {
      dir: options.dir,
      skipOnFalse: options.skipOnMissing,
      skipReason: `Master data not found at ${options.masterCheckUrl} (selector: ${options.masterSelector})`,
    },
  );
}

/**
 * Download template when master data exists (API-based check).
 * Makes a request to masterApiUrl and uses masterApiCheck to verify
 * the response indicates master data is present.
 *
 * @example
 * ```ts
 * const result = await downloadTemplateWithMasterApi(page, {
 *   masterApiUrl: '/api/v1/departments',
 *   masterApiCheck: (res) => Array.isArray(res) && res.length > 0,
 *   downloadTrigger: async () => page.click('button.download-template'),
 * });
 * ```
 */
export async function downloadTemplateWithMasterApi(
  page: Page,
  options: {
    /** API endpoint to check master data */
    masterApiUrl: string;
    /** Response check: truthy = master exists */
    masterApiCheck: (response: unknown) => boolean;
    /** Trigger the download action */
    downloadTrigger: () => Promise<void>;
    /** Download directory */
    dir?: string;
    /** Skip test if master not found (default: false) */
    skipOnMissing?: boolean;
  },
): Promise<DownloadResult | null> {
  return downloadIf(
    page,
    async () => {
      try {
        const response = await page.request.get(options.masterApiUrl);
        if (!response.ok()) return false;
        const body = await response.json();
        return options.masterApiCheck(body);
      } catch {
        return false;
      }
    },
    options.downloadTrigger,
    {
      dir: options.dir,
      skipOnFalse: options.skipOnMissing,
      skipReason: `Master data not found via API: ${options.masterApiUrl}`,
    },
  );
}

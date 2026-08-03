/**
 * Template roundtrip helper — download template → modify → re-upload.
 *
 * Common ERP pattern: download Excel template, fill data, upload back.
 * The caller provides a modify callback that receives the downloaded file path
 * and returns the modified buffer (or writes to a new file).
 *
 * @module src/support/pw/template-roundtrip
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from '@playwright/test';
import { downloadAndSave, uploadFixture } from './files';
import { detectFileKind, type FileKind } from './file-content-core';

export interface TemplateRoundtripResult {
  /** Downloaded template path */
  downloadedPath: string;
  /** Modified file path (if saved separately) */
  modifiedPath?: string;
  /** Upload success */
  uploaded: boolean;
  /** Template file kind */
  kind: FileKind;
}

/**
 * Full roundtrip: download template → modify → re-upload.
 *
 * Flow:
 * 1. Download template via `downloadAndSave()`
 * 2. Call `modifyFile()` callback with the downloaded path
 * 3. Upload the modified file via `uploadFixture()`
 * 4. Optionally verify success via `verifySuccess()` callback
 *
 * @example
 * ```ts
 * // Download Excel template, fill a cell, upload back
 * const result = await templateRoundtrip(page, {
 *   downloadTrigger: async () => page.click('button.download-template'),
 *   modifyFile: (filePath) => {
 *     const workbook = XLSX.readFile(filePath);
 *     workbook.Sheets['Data']['A2'] = { v: 'Test Value' };
 *     XLSX.writeFile(workbook, filePath);
 *     return fs.readFileSync(filePath);
 *   },
 *   uploadLocator: page.locator('input[type="file"]'),
 * });
 * ```
 */
export async function templateRoundtrip(
  page: Page,
  options: {
    /** Trigger the template download */
    downloadTrigger: () => Promise<void>;
    /**
     * Modify the downloaded file.
     * Receives the downloaded file path.
     * Returns the modified buffer (or writes to a new path and returns its buffer).
     * If the callback modifies the file in-place, just return fs.readFileSync(filePath).
     */
    modifyFile: (filePath: string) => Promise<Buffer> | Buffer;
    /** File input locator for re-upload */
    uploadLocator: import('@playwright/test').Locator;
    /** Verify upload success (optional) */
    verifySuccess?: () => Promise<void>;
    /** Download directory */
    dir?: string;
  },
): Promise<TemplateRoundtripResult> {
  // 1. Download template
  const { path: downloadedPath, suggestedFilename } = await downloadAndSave(
    page,
    options.downloadTrigger,
    { dir: options.dir },
  );

  // 2. Detect file kind
  const kind = detectFileKind(downloadedPath);

  // 3. Modify
  const modifiedBuffer = await options.modifyFile(downloadedPath);

  // Save modified file alongside the original
  const dir = path.dirname(downloadedPath);
  const modifiedPath = path.join(dir, `modified-${suggestedFilename}`);
  fs.writeFileSync(modifiedPath, modifiedBuffer);

  // 4. Upload modified file
  await uploadFixture(options.uploadLocator, modifiedPath);

  // 5. Verify success (if callback provided)
  let uploaded = true;
  if (options.verifySuccess) {
    try {
      await options.verifySuccess();
    } catch {
      uploaded = false;
    }
  }

  return {
    downloadedPath,
    modifiedPath,
    uploaded,
    kind,
  };
}

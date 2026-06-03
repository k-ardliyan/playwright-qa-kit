/**
 * Environment Loader for the Playwright AI Agent Framework.
 *
 * Selects and loads the correct per-environment `.env` file from the
 * `environments/` folder based on the `APP_ENV` environment variable.
 *
 * Logic flow:
 * 1. Read APP_ENV from process.env
 * 2. If APP_ENV is undefined → log warn "default environment", set to 'local'
 * 3. If APP_ENV value is not in the known set → log warn "unrecognised value", set to 'local'
 * 4. Try loading candidates in order:
 *    a. environments/{APP_ENV}.env         (primary — real credentials)
 *    b. environments/{APP_ENV}.env.example (fallback — template, warn to fill values)
 * 5. If no candidate exists → throw descriptive Error listing all paths tried
 * 6. Log success at info level
 *
 * Supported environments: local | dev | staging | production
 *
 * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KNOWN_ENVIRONMENTS = ['local', 'dev', 'staging', 'production'] as const;
type KnownEnvironment = (typeof KNOWN_ENVIRONMENTS)[number];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads `APP_ENV` from `process.env`, selects the matching file from the
 * `environments/` folder, and loads it into `process.env` via dotenv.
 *
 * Lookup order (first match wins):
 * 1. `environments/{APP_ENV}.env`          — primary (real credentials)
 * 2. `environments/{APP_ENV}.env.example`  — template fallback (warn to fill values)
 *
 * Defaults to `local` when `APP_ENV` is undefined or unrecognised.
 *
 * @throws {Error} If no candidate file is found, with a list of all paths tried.
 */
export function loadEnvironment(): void {
  const rawEnv = process.env['APP_ENV'];

  let appEnv: KnownEnvironment;

  if (rawEnv === undefined) {
    // Requirement 5.3: default to local, log warning
    logger.warn('APP_ENV is not set — using default environment: local');
    appEnv = 'local';
  } else if (!(KNOWN_ENVIRONMENTS as readonly string[]).includes(rawEnv)) {
    // Requirement 5.2: unrecognised value, default to local, log warning
    logger.warn(`APP_ENV has unrecognised value: "${rawEnv}" — falling back to local`);
    appEnv = 'local';
  } else {
    appEnv = rawEnv as KnownEnvironment;
  }

  const cwd = process.cwd();

  // Requirement 5.4: try candidates in order — primary first, then template fallback
  const candidates = [
    {
      resolvedPath: path.resolve(cwd, `environments/${appEnv}.env`),
      label: `environments/${appEnv}.env`,
      isTemplate: false,
    },
    {
      resolvedPath: path.resolve(cwd, `environments/${appEnv}.env.example`),
      label: `environments/${appEnv}.env.example`,
      isTemplate: true,
    },
  ];

  const loaded = candidates.find((c) => fs.existsSync(c.resolvedPath));

  if (!loaded) {
    throw new Error(
      `Environment file not found for '${appEnv}'.\n` +
        `Tried:\n` +
        candidates.map((c) => `  - ${c.label}`).join('\n') +
        `\n\nCreate environments/${appEnv}.env with your credentials.`,
    );
  }

  if (loaded.isTemplate) {
    logger.warn(
      `environments/${appEnv}.env not found — loading template '${loaded.label}'. ` +
        `Create environments/${appEnv}.env and replace placeholder values before running tests.`,
    );
  }

  // Requirement 5.5 (via dotenv): load the selected environment file
  dotenv.config({ path: loaded.resolvedPath });

  // Requirement 5.6: log success at info level
  logger.info(`Loaded environment '${appEnv}' from ${loaded.label}`);
}

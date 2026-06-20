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
 * 7. Optionally overlay adapter-specific env files (non-overriding)
 *
 * Supported environments: local | dev | staging | production
 *
 * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenvx from '@dotenvx/dotenvx';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KNOWN_ENVIRONMENTS = ['local', 'dev', 'staging', 'production'] as const;
type KnownEnvironment = (typeof KNOWN_ENVIRONMENTS)[number];

export interface AdapterEnvRef {
  dir: string;
  name: string;
}

export interface LoadEnvironmentOptions {
  /** Overlay adapter-specific defaults after core load (non-overriding). */
  adapterEnv?: AdapterEnvRef;
}

export function getSecureKeysPath(): string {
  // Climb up to find the repository root (containing package.json with 'playwright-qa-kit')
  let repoRoot = __dirname;
  while (true) {
    const pkgPath = path.join(repoRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === 'playwright-qa-kit') {
          break;
        }
      } catch {
        // ignore
      }
    }
    const parent = path.dirname(repoRoot);
    if (parent === repoRoot) {
      repoRoot = process.cwd(); // Fallback
      break;
    }
    repoRoot = parent;
  }

  const localKeysPath = path.resolve(repoRoot, 'environments/.env.keys');

  // Dynamically get project name from package.json
  const pkgPath = path.resolve(repoRoot, 'package.json');
  let projectName = 'playwright-qa-kit';
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (pkg.name) {
        projectName = pkg.name;
      }
    } catch {
      // ignore
    }
  }

  const globalKeysDir = path.resolve(os.homedir(), '.dotenvx-keys', projectName);
  const globalKeysPath = path.resolve(globalKeysDir, '.env.keys');

  // If local keys exist in workspace, automatically migrate them to the secure global folder
  if (fs.existsSync(localKeysPath)) {
    try {
      if (!fs.existsSync(globalKeysDir)) {
        fs.mkdirSync(globalKeysDir, { recursive: true });
      }
      fs.copyFileSync(localKeysPath, globalKeysPath);
      fs.unlinkSync(localKeysPath);
      logger.info(
        `[SECURITY] Automatically migrated .env.keys to secure global folder: ${globalKeysPath}`,
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`[SECURITY] Failed to migrate .env.keys to global folder: ${errMsg}`);
      return localKeysPath; // Fallback to local if migration fails
    }
  }

  return globalKeysPath;
}

/**
 * Reads `APP_ENV` from `process.env`, selects the matching file from the
 * `environments/` folder, and loads it into `process.env` via dotenv.
 *
 * Lookup order (first match wins):
 * 1. `environments/{APP_ENV}.env`          — primary (real credentials)
 * 2. `environments/{APP_ENV}.env.example`  — template fallback (warn to fill values)
 *
 * When `options.adapterEnv` is set, overlays `{dir}/{name}.env` then
 * `{dir}/{name}.env.example` without overwriting keys already set by core load.
 *
 * Defaults to `local` when `APP_ENV` is undefined or unrecognised.
 *
 * @throws {Error} If no candidate file is found, with a list of all paths tried.
 */
export function loadEnvironment(options?: LoadEnvironmentOptions): void {
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
  } else {
    // [SECURITY GUARD] If the file is encrypted but no decryption key is available,
    // fallback to loading the plaintext dummy .env.example instead of ciphertext values.
    const secureKeysPath = getSecureKeysPath();
    const appEnvUpper = appEnv.toUpperCase();
    const hasEnvKey =
      process.env.DOTENV_PRIVATE_KEY ||
      process.env[`DOTENV_PRIVATE_KEY_${appEnvUpper}DEVELOPMENT`] ||
      process.env[`DOTENV_PRIVATE_KEY_${appEnvUpper}`];

    const hasKeys = fs.existsSync(secureKeysPath) || hasEnvKey;

    if (!hasKeys) {
      const fallbackPath = path.resolve(cwd, `environments/${appEnv}.env.example`);
      if (fs.existsSync(fallbackPath)) {
        dotenvx.config({ path: fallbackPath });
        logger.warn(
          `[SECURITY] Decryption keys missing. Falling back to dummy template: environments/${appEnv}.env.example`,
        );
        if (options?.adapterEnv) {
          loadAdapterEnvOverlay(options.adapterEnv, cwd);
        }
        return;
      }
    }
  }

  // Requirement 5.5 (via dotenv): load the selected environment file
  dotenvx.config({
    path: loaded.resolvedPath,
    envKeysFile: getSecureKeysPath(),
  });

  // Requirement 5.6: log success at info level
  logger.info(`Loaded environment '${appEnv}' from ${loaded.label}`);

  if (options?.adapterEnv) {
    loadAdapterEnvOverlay(options.adapterEnv, cwd);
  }
}

function loadAdapterEnvOverlay(adapterEnv: AdapterEnvRef, cwd: string): void {
  const overlayCandidates = [
    {
      resolvedPath: path.resolve(cwd, adapterEnv.dir, `${adapterEnv.name}.env`),
      label: `${adapterEnv.dir}/${adapterEnv.name}.env`,
    },
    {
      resolvedPath: path.resolve(cwd, adapterEnv.dir, `${adapterEnv.name}.env.example`),
      label: `${adapterEnv.dir}/${adapterEnv.name}.env.example`,
    },
  ];

  for (const candidate of overlayCandidates) {
    if (!fs.existsSync(candidate.resolvedPath)) {
      continue;
    }

    dotenvx.config({
      path: candidate.resolvedPath,
      override: false,
      envKeysFile: path.resolve(cwd, path.dirname(candidate.resolvedPath), '.env.keys'),
    });
    logger.info(`Loaded adapter env overlay from ${candidate.label}`);
    return;
  }

  logger.warn(
    `Adapter env overlay not found for '${adapterEnv.name}'. Tried:\n` +
      overlayCandidates.map((c) => `  - ${c.label}`).join('\n'),
  );
}

/**
 * Environment Loader for the Playwright AI Agent Framework.
 *
 * Selects and loads the correct per-environment `.env` file from the
 * `environments/` folder based on resolved APP_ENV (see `resolveAppEnv`).
 *
 * Logic flow:
 * 1. Resolve APP_ENV: OS → pin (environments/.active-env) → default local
 * 2. invalid_os / invalid_pin → warn + fall back to local
 * 3. default → info (not warn)
 * 4. Try loading candidates in order:
 *    a. environments/{APP_ENV}.env         (primary — real credentials)
 *    b. environments/{APP_ENV}.env.example (fallback — template, warn to fill values)
 * 5. If no candidate exists → throw descriptive Error listing all paths tried
 * 6. Set process.env.APP_ENV (+ APP_ENV_SOURCE)
 * 7. Log success at info level
 * 8. Optionally overlay adapter-specific env files (non-overriding)
 *
 * Supported environments: local | dev | staging | production
 *
 * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenvx from '@dotenvx/dotenvx';
import { resolveAppEnv, type AppEnv } from './app-env';
import { logger } from './logger';
import { resolveSecureKeysPath } from './dotenv-keys';

export interface AdapterEnvRef {
  dir: string;
  name: string;
}

export interface LoadEnvironmentOptions {
  /** Overlay adapter-specific defaults after core load (non-overriding). */
  adapterEnv?: AdapterEnvRef;
}

/**
 * Resolve secure dotenvx keys path (merge-migrates workspace .env.keys first).
 * Never overwrites existing global private keys wholesale.
 */
export function getSecureKeysPath(): string {
  // Climb up to find the repository root (package.json present)
  let repoRoot = __dirname;
  while (true) {
    const pkgPath = path.join(repoRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
        // Prefer monorepo / kit root when name matches; otherwise keep climbing
        // until filesystem root, then fall back to cwd.
        if (pkg.name) {
          // Accept any package.json as repo root once found near project
          break;
        }
      } catch {
        // ignore
      }
    }
    const parent = path.dirname(repoRoot);
    if (parent === repoRoot) {
      repoRoot = process.cwd();
      break;
    }
    repoRoot = parent;
  }

  // Prefer cwd if it looks like the project root (has environments/)
  if (fs.existsSync(path.join(process.cwd(), 'environments'))) {
    repoRoot = process.cwd();
  }

  try {
    const secure = resolveSecureKeysPath(repoRoot);
    if (fs.existsSync(secure)) {
      return secure;
    }
    return secure;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`[SECURITY] Failed to resolve/migrate dotenv keys: ${errMsg}`);
    return path.resolve(repoRoot, 'environments', '.env.keys');
  }
}

/**
 * Resolves APP_ENV (OS → pin → default), selects the matching file from the
 * `environments/` folder, and loads it into `process.env` via dotenv.
 *
 * Lookup order (first match wins):
 * 1. `environments/{APP_ENV}.env`          — primary (real credentials)
 * 2. `environments/{APP_ENV}.env.example`  — template fallback (warn to fill values)
 *
 * When `options.adapterEnv` is set, overlays `{dir}/{name}.env` then
 * `{dir}/{name}.env.example` without overwriting keys already set by core load.
 *
 * Defaults to `local` when APP_ENV is unset (info) or unrecognised (warn).
 *
 * @throws {Error} If no candidate file is found, with a list of all paths tried.
 */
export function loadEnvironment(options?: LoadEnvironmentOptions): void {
  const cwd = process.cwd();
  const resolved = resolveAppEnv({ repoRoot: cwd });
  const appEnv: AppEnv = resolved.appEnv;

  if (resolved.source === 'invalid_os') {
    logger.warn(`APP_ENV has unrecognised value: "${resolved.rawOsValue}" — falling back to local`);
  } else if (resolved.source === 'invalid_pin') {
    logger.warn(
      `environments/.active-env has unrecognised value: "${resolved.rawPinValue}" — falling back to local`,
    );
  } else if (resolved.source === 'default') {
    logger.info('Using default APP_ENV=local (environments/local.env)');
  } else if (resolved.source === 'pin') {
    logger.info(`Using APP_ENV=${appEnv} from environments/.active-env`);
  }
  // source === 'os' → silent (explicit operator intent)

  // Publish resolved selector for downstream readers (auth paths, status, reports)
  process.env.APP_ENV = appEnv;
  process.env.APP_ENV_SOURCE = resolved.source;

  // Requirement 5.4: try candidates in order — primary first, then template fallback
  const candidates = [
    {
      resolvedPath: path.resolve(cwd, `config/environments/${appEnv}.env`),
      label: `config/environments/${appEnv}.env`,
      isTemplate: false,
    },
    {
      resolvedPath: path.resolve(cwd, `config/environments/${appEnv}.env.example`),
      label: `config/environments/${appEnv}.env.example`,
      isTemplate: true,
    },
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
        `\n\nCreate config/environments/${appEnv}.env with your credentials.`,
    );
  }

  if (loaded.isTemplate) {
    logger.warn(
      `config/environments/${appEnv}.env not found — loading template '${loaded.label}'. ` +
        `Create config/environments/${appEnv}.env and replace placeholder values before running tests.`,
    );
  } else {
    // [SECURITY GUARD] Only when the primary file is encrypted (contains `encrypted:`)
    // and no decryption key is available, fall back to the plaintext .env.example.
    // Plaintext files (CI-materialized secrets, local unencrypted) must load as-is —
    // missing keys alone must NOT discard a real environments/{APP_ENV}.env.
    const fileText = fs.readFileSync(loaded.resolvedPath, 'utf8');
    const isEncrypted = fileText.includes('encrypted:');

    if (isEncrypted) {
      const secureKeysPath = getSecureKeysPath();
      const appEnvUpper = appEnv.toUpperCase();
      const hasEnvKey =
        process.env.DOTENV_PRIVATE_KEY ||
        process.env[`DOTENV_PRIVATE_KEY_${appEnvUpper}DEVELOPMENT`] ||
        process.env[`DOTENV_PRIVATE_KEY_${appEnvUpper}`];

      const hasKeys = fs.existsSync(secureKeysPath) || Boolean(hasEnvKey);

      if (!hasKeys) {
        // Check canonical config/environments/ path first, then legacy environments/ fallback
        const fallbackPaths = [
          path.resolve(cwd, `config/environments/${appEnv}.env.example`),
          path.resolve(cwd, `environments/${appEnv}.env.example`),
        ];
        const existingFallback = fallbackPaths.find((p) => fs.existsSync(p));
        if (existingFallback) {
          dotenvx.config({ path: existingFallback });
          // Re-assert after dotenv — file must not hijack APP_ENV
          process.env.APP_ENV = appEnv;
          process.env.APP_ENV_SOURCE = resolved.source;
          logger.warn(
            `[SECURITY] Decryption keys missing for encrypted ${appEnv}.env. ` +
              `Falling back to dummy template: ${path.relative(cwd, existingFallback)}`,
          );
          if (options?.adapterEnv) {
            loadAdapterEnvOverlay(options.adapterEnv, cwd);
          }
          return;
        }
        throw new Error(
          `Encrypted environments/${appEnv}.env found but no dotenvx private key is available, ` +
            `and no .env.example fallback was found.\n` +
            `Tried:\n` +
            fallbackPaths.map((p) => `  - ${path.relative(cwd, p)}`).join('\n') +
            `\n\nFix: restore ~/.dotenvx-keys/<project>/.env.keys, or recreate a plaintext ` +
            `config/environments/${appEnv}.env (CI materialize / npm run env:edit).`,
        );
      }
    }
  }

  // Requirement 5.5 (via dotenv): load the selected environment file
  dotenvx.config({
    path: loaded.resolvedPath,
    envKeysFile: getSecureKeysPath(),
  });

  // APP_ENV is the sole patent selector — re-assert after dotenv (file must not hijack it)
  process.env.APP_ENV = appEnv;
  process.env.APP_ENV_SOURCE = resolved.source;

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

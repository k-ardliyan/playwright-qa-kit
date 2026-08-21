/**
 * Setup Wizard — core orchestrator.
 *
 * Interactive CLI wizard that guides users through:
 * 1. APP_ENV selection
 * 2. BASE_URL configuration
 * 3. Role credential entry
 * 4. Auth challenge mode
 * 5. File write + validation
 *
 * Non-interactive mode (--check) validates existing setup without prompting.
 *
 * @module src/setup/wizard
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { type AppEnv, resolveAppEnv } from '../utils/app-env';
import { type ChallengeMode } from '../support/human-challenge';
import { type WizardRoleInput } from '../shared/utils/role-credentials';
import { logger } from '../utils/logger';

import {
  promptAppEnv,
  promptBaseUrl,
  promptRoleCredentials,
  promptRoles,
  promptChallengeMode,
  confirmOverwrite,
  type RoleFields,
} from './wizard-prompts';

import { writeEnvFile, readExistingEnv, type EnvWriteResult } from './wizard-writer';

import { validateSetup, type ValidationResult } from './wizard-validate';

// ─── Public types ────────────────────────────────────────────────────────────

export interface WizardOptions {
  /** Non-interactive mode: only validate, no prompts */
  checkOnly?: boolean;
  /** Override APP_ENV (default: resolve from existing) */
  appEnv?: AppEnv;
}

export interface WizardResult {
  /** Absolute path of the env file */
  envFilePath: string;
  /** Roles that were configured */
  roles: string[];
  /** Whether this was a new setup */
  isNewSetup: boolean;
  /** Validation result after write */
  validation: ValidationResult;
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

/**
 * Run the setup wizard.
 *
 * Flow:
 * 1. Detect existing config → if exists, ask update or skip
 * 2. Prompt APP_ENV (default: resolve from existing)
 * 3. Prompt BASE_URL + validate reachable
 * 4. Prompt role credentials
 * 5. Prompt AUTH_CHALLENGE_MODE
 * 6. Prompt encryption
 * 7. Write env file
 * 8. Validate
 * 9. Print summary
 */
export async function runSetupWizard(options?: WizardOptions): Promise<WizardResult> {
  const opts = options ?? {};

  // ─── Step 1: Resolve APP_ENV ────────────────────────────────────────────
  let appEnv: AppEnv;

  if (opts.appEnv) {
    appEnv = opts.appEnv;
  } else {
    const resolved = resolveAppEnv({ repoRoot: process.cwd() });
    appEnv = resolved.appEnv;
  }

  // ─── Check-only mode ────────────────────────────────────────────────────
  if (opts.checkOnly) {
    return runCheckOnly(appEnv);
  }

  // ─── Step 2: Detect existing ────────────────────────────────────────────
  const existing = readExistingEnv(appEnv);

  if (existing) {
    const envPath = resolveEnvPath(appEnv);
    const shouldUpdate = await confirmOverwrite(envPath);
    if (!shouldUpdate) {
      logger.info('Setup wizard cancelled — keeping existing config.');
      const validation = await validateSetup(appEnv, existing, envPath);
      return {
        envFilePath: envPath,
        roles: [],
        isNewSetup: false,
        validation,
      };
    }
  }

  // ─── Step 3: Prompt APP_ENV ─────────────────────────────────────────────
  appEnv = await promptAppEnv(appEnv);

  // ─── Step 4: Prompt BASE_URL ────────────────────────────────────────────
  const existingUrl = existing?.['BASE_URL'];
  const baseUrl = await promptBaseUrl(existingUrl);

  // ─── Step 5: Prompt roles ───────────────────────────────────────────────
  const existingRoles = existing ? detectExistingRoles(existing) : [];
  const roleNames = await promptRoles(existingRoles.length > 0 ? existingRoles : undefined);

  const roleInputs: WizardRoleInput[] = [];
  for (const role of roleNames) {
    const existingFields = existing ? getExistingRoleFields(existing, role) : undefined;
    const fields = await promptRoleCredentials(role, existingFields);
    roleInputs.push({ name: role, fields });
  }

  // ─── Step 6: Prompt challenge mode ──────────────────────────────────────
  const existingChallenge = existing?.['AUTH_CHALLENGE_MODE'];
  const challengeMode = await promptChallengeMode(existingChallenge);

  // ─── Step 7: Write env file ─────────────────────────────────────────────
  const writeResult = writeEnvFile({
    appEnv,
    baseUrl,
    roles: roleInputs,
    challengeMode,
  });

  logger.info(`✅ Env file written: ${writeResult.envFilePath}`);
  if (writeResult.keysPreserved > 0) {
    logger.info(`   Preserved ${writeResult.keysPreserved} existing keys`);
  }

  // ─── Step 9: Validate ───────────────────────────────────────────────────
  const freshEnv = readExistingEnv(appEnv);
  const validation = await validateSetup(appEnv, freshEnv, writeResult.envFilePath);

  // ─── Step 10: Print summary ─────────────────────────────────────────────
  printSummary({
    appEnv,
    baseUrl,
    roles: roleNames,
    challengeMode,
    writeResult,
    validation,
  });

  return {
    envFilePath: writeResult.envFilePath,
    roles: roleNames,
    isNewSetup: writeResult.isNewFile,
    validation,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveEnvPath(appEnv: AppEnv): string {
  let dir = process.cwd();
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const configPath = path.join(dir, 'config', 'environments', `${appEnv}.env`);
      if (fs.existsSync(configPath)) return configPath;
      return path.join(dir, 'environments', `${appEnv}.env`);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const configPath = path.join(process.cwd(), 'config', 'environments', `${appEnv}.env`);
  if (fs.existsSync(configPath)) return configPath;
  return path.join(process.cwd(), 'environments', `${appEnv}.env`);
}

function detectExistingRoles(envMap: Record<string, string>): string[] {
  const roles = new Set<string>();
  roles.add('user'); // always present

  for (const key of Object.keys(envMap)) {
    const m = /^([A-Z0-9_]+?)_(EMAIL|USERNAME|PHONE|PASSWORD)$/.exec(key);
    if (!m) continue;
    const prefix = m[1];
    if (prefix === 'TEST_USER' || prefix === 'DOTENV') continue;
    if (prefix.endsWith('_LOGIN_ID')) continue;
    roles.add(prefix.toLowerCase().replace(/_/g, '-'));
  }

  return [...roles].sort();
}

function getExistingRoleFields(
  envMap: Record<string, string>,
  role: string,
): Partial<RoleFields> | undefined {
  const prefix = role === 'user' ? 'TEST_USER' : role.toUpperCase().replace(/-/g, '_');
  const fields: Partial<RoleFields> = {};

  if (envMap[`${prefix}_EMAIL`]) fields.email = envMap[`${prefix}_EMAIL`];
  if (envMap[`${prefix}_USERNAME`]) fields.username = envMap[`${prefix}_USERNAME`];
  if (envMap[`${prefix}_PHONE`]) fields.phone = envMap[`${prefix}_PHONE`];
  if (envMap[`${prefix}_PASSWORD`]) fields.password = envMap[`${prefix}_PASSWORD`];

  const pref = envMap[`${prefix}_LOGIN_ID_PREF`];
  if (pref === 'email' || pref === 'username' || pref === 'phone') {
    fields.loginIdPref = pref;
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

async function runCheckOnly(appEnv: AppEnv): Promise<WizardResult> {
  const existing = readExistingEnv(appEnv);
  const envPath = resolveEnvPath(appEnv);
  const validation = await validateSetup(appEnv, existing, envPath);

  if (validation.valid) {
    console.log('✅ Setup is valid and ready for testing.');
  } else {
    console.log('❌ Setup has issues:');
    for (const err of validation.errors) {
      console.log(`   ERROR: ${err}`);
    }
  }

  if (validation.warnings.length > 0) {
    for (const w of validation.warnings) {
      console.log(`   ⚠ ${w}`);
    }
  }

  console.log(`   Reachable: ${validation.reachable ? '✅' : '❌'}`);
  console.log(`   Roles ready: ${validation.rolesReady.join(', ') || 'none'}`);
  console.log(`   Roles incomplete: ${validation.rolesIncomplete.join(', ') || 'none'}`);

  return {
    envFilePath: envPath,
    roles: validation.rolesReady,
    isNewSetup: false,
    validation,
  };
}

function printSummary(data: {
  appEnv: AppEnv;
  baseUrl: string;
  roles: string[];
  challengeMode: ChallengeMode;
  writeResult: EnvWriteResult;
  validation: ValidationResult;
}): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Setup Wizard — Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  APP_ENV:     ${data.appEnv}`);
  console.log(`  BASE_URL:    ${data.baseUrl}`);
  console.log(`  Roles:       ${data.roles.join(', ')}`);
  console.log(`  Challenge:   ${data.challengeMode}`);
  console.log(`  Env file:    ${data.writeResult.envFilePath}`);
  console.log(`  Reachable:   ${data.validation.reachable ? '✅' : '❌'}`);
  console.log(`  Ready roles: ${data.validation.rolesReady.join(', ') || 'none'}`);
  console.log('');

  if (data.validation.warnings.length > 0) {
    console.log('  ⚠ Warnings:');
    for (const w of data.validation.warnings) {
      console.log(`    - ${w}`);
    }
    console.log('');
  }

  if (data.challengeMode !== 'none') {
    console.log('  ℹ Next step: Run auth setup to materialize sessions:');
    console.log('    npx playwright test --config src/support/auth.setup.ts');
  } else {
    console.log('  ℹ Next step: Run your first test:');
    console.log('    npx playwright test');
  }
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

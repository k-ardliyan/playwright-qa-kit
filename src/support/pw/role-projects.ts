/**
 * Role-aware Playwright project builders (official multi-project + dependencies pattern).
 *
 * Auth storage is scoped by APP_ENV (sole environment patent):
 *   `.auth/{APP_ENV}/{role}.json`
 *
 * Keep root template chromium project generic; compose role projects in a fork config
 * or playwright.role-projects.config.ts.
 *
 * @see https://playwright.dev/docs/auth
 * @see docs/AUTH-CONTEXT-CONVENTION.md
 */

import type { Project } from '@playwright/test';
import { devices } from '@playwright/test';

export interface RoleProjectOptions {
  /** Business role slug, e.g. finance, super-admin (never invent role "general") */
  role: string;
  /** storageState path (default `.auth/{APP_ENV}/{role}.json`) */
  storageState?: string;
  /** Test match for this role (default files ending with -<role>.spec.ts) */
  testMatch?: string | RegExp;
  testDir?: string;
  testIgnore?: string | RegExp | Array<string | RegExp>;
  /** Setup project name this role depends on (default setup) */
  setupProjectName?: string;
  device?: keyof typeof devices;
  /** Override APP_ENV segment for path (default process.env.APP_ENV || 'local') */
  appEnv?: string;
}

function canonicalRoleSlug(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === 'default' || r === 'general') return 'user';
  return r;
}

/** Default storage path for a role under active APP_ENV. */
export function roleStorageStatePath(role: string, appEnv?: string): string {
  const env = (appEnv ?? process.env.APP_ENV ?? 'local').trim() || 'local';
  return `.auth/${env}/${canonicalRoleSlug(role)}.json`;
}

/**
 * Build a single role test project that depends on auth setup.
 * Spec files should still call test.use({ storageState }) when needed; project-level
 * storageState covers the common case for role-suffixed spec files.
 */
export function buildRoleProject(options: RoleProjectOptions): Project {
  const role = canonicalRoleSlug(options.role);
  const setupName = options.setupProjectName ?? 'setup';
  const deviceName = options.device ?? 'Desktop Chrome';
  const storageState = options.storageState ?? roleStorageStatePath(role, options.appEnv);

  return {
    name: `${role}-tests`,
    use: {
      ...devices[deviceName],
      storageState,
    },
    testDir: options.testDir ?? './tests',
    testMatch: options.testMatch ?? new RegExp(`.*-${escapeRegExp(role)}\\.spec\\.ts$`),
    ...(options.testIgnore ? { testIgnore: options.testIgnore } : {}),
    dependencies: [setupName],
  };
}

/** Build one project per role (plus optional general/unauth project left to caller). */
export function buildRoleProjects(
  roles: string[],
  shared?: Omit<RoleProjectOptions, 'role'>,
): Project[] {
  return roles.filter(Boolean).map((role) => buildRoleProject({ ...shared, role }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

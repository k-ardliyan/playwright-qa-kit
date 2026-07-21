/**
 * Role-aware Playwright project builders (official multi-project + dependencies pattern).
 *
 * Use when a fork has multi-role auth files under .auth/<role>.json.
 * Keep root template chromium project generic; compose role projects in a fork config
 * or playwright.role-projects.config.ts.
 *
 * @see https://playwright.dev/docs/auth
 * @see docs/AUTH-CONTEXT-CONVENTION.md
 */

import type { Project } from '@playwright/test';
import { devices } from '@playwright/test';

export interface RoleProjectOptions {
  /** Business role slug, e.g. finance, super-admin */
  role: string;
  /** storageState path (default .auth/<role>.json) */
  storageState?: string;
  /** Test match for this role (default files ending with -<role>.spec.ts) */
  testMatch?: string | RegExp;
  testDir?: string;
  testIgnore?: string | RegExp | Array<string | RegExp>;
  /** Setup project name this role depends on (default setup) */
  setupProjectName?: string;
  device?: keyof typeof devices;
}

/**
 * Build a single role test project that depends on auth setup.
 * Spec files should still call test.use({ storageState }) when needed; project-level
 * storageState covers the common case for role-suffixed spec files.
 */
export function buildRoleProject(options: RoleProjectOptions): Project {
  const role = options.role.trim();
  const setupName = options.setupProjectName ?? 'setup';
  const deviceName = options.device ?? 'Desktop Chrome';
  const storageState = options.storageState ?? `.auth/${role}.json`;

  return {
    name: `${role}-tests`,
    use: {
      ...devices[deviceName],
      storageState,
    },
    testDir: options.testDir ?? './src/tests',
    testMatch: options.testMatch ?? new RegExp(`.*-${escapeRegExp(role)}\\.spec\\.ts$`),
    ...(options.testIgnore ? { testIgnore: options.testIgnore } : {}),
    dependencies: [setupName],
  };
}

/** Build one project per role (plus optional general project left to caller). */
export function buildRoleProjects(
  roles: string[],
  shared?: Omit<RoleProjectOptions, 'role'>,
): Project[] {
  return roles.filter(Boolean).map((role) => buildRoleProject({ ...shared, role }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

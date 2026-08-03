/**
 * Setup Wizard — interactive prompt UI for first-run and update flows.
 *
 * Uses the 'prompts' library (already a project dependency).
 * All prompts are cancellable — Ctrl+C aborts the wizard cleanly.
 *
 * @module src/setup/wizard-prompts
 */

import prompts from 'prompts';
import { KNOWN_APP_ENVS, type AppEnv, isKnownAppEnv } from '../utils/app-env';
import { type ChallengeMode, CHALLENGE_MODES } from '../support/human-challenge';

export interface RoleFields {
  email?: string;
  username?: string;
  phone?: string;
  password: string;
  loginIdPref?: 'email' | 'username' | 'phone';
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isNonEmpty(v: string): boolean {
  return v.trim().length > 0;
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripTrailingSlash(v: string): string {
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

/** Abort handler — re-throws a special cancel so the orchestrator can exit cleanly. */
function onCancel(): never {
  throw new Error('SETUP_WIZARD_CANCELLED');
}

// ─── Public prompts ──────────────────────────────────────────────────────────

/**
 * Prompt for APP_ENV selection.
 * Pre-fills existing value if provided.
 */
export async function promptAppEnv(existing?: string): Promise<AppEnv> {
  const { value } = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Select target environment (APP_ENV)',
      choices: KNOWN_APP_ENVS.map((env) => ({
        title: env,
        value: env,
        selected: env === existing,
      })),
      initial: existing && isKnownAppEnv(existing) ? KNOWN_APP_ENVS.indexOf(existing as AppEnv) : 0,
    },
    { onCancel },
  );
  return value as AppEnv;
}

/**
 * Prompt for BASE_URL.
 * Validates: HTTP/HTTPS, no trailing slash, optionally reachable.
 */
export async function promptBaseUrl(existing?: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts += 1;
    const { value } = await prompts(
      {
        type: 'text',
        name: 'value',
        message: 'Base URL of the application under test',
        initial: existing ?? 'http://localhost:3000',
        validate: (v: string) => {
          if (!isNonEmpty(v)) return 'URL cannot be empty';
          if (!isValidUrl(v)) return 'Must be a valid HTTP/HTTPS URL';
          return true;
        },
      },
      { onCancel },
    );

    const url = stripTrailingSlash(value as string);

    // Optional: test reachability
    const { confirm } = await prompts(
      {
        type: 'confirm',
        name: 'confirm',
        message: `Test reachability of ${url}? (HEAD request)`,
        initial: true,
      },
      { onCancel },
    );

    if (confirm) {
      let reachable: boolean;
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        reachable = res.ok || res.status === 401 || res.status === 302;
      } catch {
        reachable = false;
      }

      if (!reachable) {
        const { proceed } = await prompts(
          {
            type: 'confirm',
            name: 'proceed',
            message: `⚠ ${url} is not reachable. Continue anyway?`,
            initial: false,
          },
          { onCancel },
        );
        if (!proceed) continue;
      }
    }

    return url;
  }

  // Fallback after max attempts
  throw new Error(`Failed to get a valid BASE_URL after ${maxAttempts} attempts`);
}

/**
 * Prompt for credentials of a single role.
 * Pre-fills existing values if provided.
 */
export async function promptRoleCredentials(
  role: string,
  existing?: Partial<RoleFields>,
): Promise<RoleFields> {
  const fields: RoleFields = { password: '' };

  // Email
  const { hasEmail } = await prompts(
    {
      type: 'confirm',
      name: 'hasEmail',
      message: `Does role "${role}" use email for login?`,
      initial: existing?.email ? true : false,
    },
    { onCancel },
  );

  if (hasEmail) {
    const { email } = await prompts(
      {
        type: 'text',
        name: 'email',
        message: `  Email for ${role}`,
        initial: existing?.email ?? '',
        validate: (v: string) => (v && !isValidEmail(v) ? 'Invalid email format' : true),
      },
      { onCancel },
    );
    fields.email = email as string;
  }

  // Username
  const { hasUsername } = await prompts(
    {
      type: 'confirm',
      name: 'hasUsername',
      message: `Does role "${role}" use username for login?`,
      initial: existing?.username ? true : false,
    },
    { onCancel },
  );

  if (hasUsername) {
    const { username } = await prompts(
      {
        type: 'text',
        name: 'username',
        message: `  Username for ${role}`,
        initial: existing?.username ?? '',
        validate: (v: string) => v.trim().length > 0 || 'Username cannot be empty',
      },
      { onCancel },
    );
    fields.username = username as string;
  }

  // Phone
  const { hasPhone } = await prompts(
    {
      type: 'confirm',
      name: 'hasPhone',
      message: `Does role "${role}" use phone for login?`,
      initial: existing?.phone ? true : false,
    },
    { onCancel },
  );

  if (hasPhone) {
    const { phone } = await prompts(
      {
        type: 'text',
        name: 'phone',
        message: `  Phone for ${role}`,
        initial: existing?.phone ?? '',
        validate: (v: string) => v.trim().length > 0 || 'Phone cannot be empty',
      },
      { onCancel },
    );
    fields.phone = phone as string;
  }

  // Password (always required)
  const { password } = await prompts(
    {
      type: 'password',
      name: 'password',
      message: `Password for ${role}`,
      validate: (v: string) => v.trim().length > 0 || 'Password cannot be empty',
    },
    { onCancel },
  );
  fields.password = password as string;

  // Login ID preference (only if multiple identifiers provided)
  const identifiers: Array<'email' | 'username' | 'phone'> = [];
  if (fields.email) identifiers.push('email');
  if (fields.username) identifiers.push('username');
  if (fields.phone) identifiers.push('phone');

  if (identifiers.length > 1) {
    const { pref } = await prompts(
      {
        type: 'select',
        name: 'pref',
        message: `Preferred login identifier for ${role}`,
        choices: identifiers.map((id) => ({
          title: id,
          value: id,
          selected: id === existing?.loginIdPref,
        })),
      },
      { onCancel },
    );
    fields.loginIdPref = pref as 'email' | 'username' | 'phone';
  } else if (identifiers.length === 1) {
    fields.loginIdPref = identifiers[0];
  }

  return fields;
}

/**
 * Prompt for which roles to configure.
 * Always includes 'user' (default role).
 */
export async function promptRoles(existingRoles?: string[]): Promise<string[]> {
  const { input } = await prompts(
    {
      type: 'list',
      name: 'input',
      message: 'Roles to configure (comma-separated, e.g. "user,finance,super-admin")',
      initial: existingRoles?.join(',') ?? 'user',
      separator: ',',
    },
    { onCancel },
  );

  const roles = (input as string[])
    .map((r: string) => r.trim().toLowerCase())
    .filter((r: string) => r.length > 0);

  // Ensure 'user' is always present
  if (!roles.includes('user')) {
    roles.unshift('user');
  }

  return roles;
}

/**
 * Prompt for AUTH_CHALLENGE_MODE.
 */
export async function promptChallengeMode(existing?: string): Promise<ChallengeMode> {
  const { mode } = await prompts(
    {
      type: 'select',
      name: 'mode',
      message: 'Authentication challenge mode',
      choices: CHALLENGE_MODES.map((m) => ({
        title: m,
        value: m,
        description:
          m === 'none'
            ? 'No challenge (default)'
            : m === 'otp-browser'
              ? 'OTP via headed browser (recommended)'
              : m === 'otp-stdin'
                ? 'OTP via terminal prompt'
                : m === 'captcha-browser'
                  ? 'CAPTCHA via headed browser'
                  : m === 'auto'
                    ? 'Auto-detect challenge type'
                    : undefined,
        selected: m === (existing ?? 'none'),
      })),
      initial: CHALLENGE_MODES.indexOf((existing ?? 'none') as ChallengeMode),
    },
    { onCancel },
  );
  return mode as ChallengeMode;
}

/**
 * Prompt to confirm overwriting an existing env file.
 */
export async function confirmOverwrite(envFilePath: string): Promise<boolean> {
  const { overwrite } = await prompts(
    {
      type: 'confirm',
      name: 'overwrite',
      message: `Env file already exists: ${envFilePath}\n  Update it?`,
      initial: true,
    },
    { onCancel },
  );
  return overwrite as boolean;
}

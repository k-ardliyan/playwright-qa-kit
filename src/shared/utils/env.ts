/**
 * Modul pembaca dan validator Environment Variable secara type-safe.
 *
 * APP_ENV = sole patent environment selector.
 * Role credentials: getRoleLoginId / getRolePassword (uniform schema).
 */

import { roleCredentialKeys, resolveLoginIdentifier } from './role-credentials';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === null) {
    throw new Error(
      `[Config Error] Environment variable '${key}' tidak ditemukan.\n` +
        `Pastikan key '${key}' tersedia di file .env atau di environment CI.`,
    );
  }
  return value;
}

const UNSAFE_VALUES = new Set([
  '',
  'changeme',
  'change-me',
  'your_email',
  'your_password',
  'your_password_here',
  'test@example.com',
  'qa@example.com',
  'invalid-password-placeholder',
]);

function requireSecretEnv(key: string): string {
  const value = requireEnv(key).trim();
  if (UNSAFE_VALUES.has(value.toLowerCase())) {
    throw new Error(
      `[Config Error] Environment variable '${key}' kosong atau masih placeholder.\n` +
        `Isi dengan credential QA yang valid di file .env lokal Anda.`,
    );
  }
  return value;
}

function optionalSecretEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0 || UNSAFE_VALUES.has(value.toLowerCase())) {
    return undefined;
  }
  return value;
}

export const env = {
  get BASE_URL(): string {
    return requireEnv('BASE_URL');
  },

  /** Active profile: local | dev | staging | production */
  get APP_ENV(): string {
    return requireEnv('APP_ENV', 'local');
  },

  /** @deprecated Alias of APP_ENV */
  get ENV_NAME(): string {
    return this.APP_ENV;
  },

  get USER_EMAIL(): string {
    return requireSecretEnv('TEST_USER_EMAIL');
  },

  get USER_USERNAME(): string | undefined {
    return optionalSecretEnv('TEST_USER_USERNAME');
  },

  get USER_PHONE(): string | undefined {
    return optionalSecretEnv('TEST_USER_PHONE');
  },

  get USER_PASSWORD(): string {
    return requireSecretEnv('TEST_USER_PASSWORD');
  },

  /** Resolved login id for role (pref → email → username → phone) */
  getRoleLoginId(role: string): string {
    const ref = roleCredentialKeys(role);
    const result = resolveLoginIdentifier(process.env as Record<string, string>, ref);
    if ('error' in result) {
      throw new Error(`[Config Error] ${result.error}`);
    }
    return result.value;
  },

  getRolePassword(role: string): string {
    const ref = roleCredentialKeys(role);
    return requireSecretEnv(ref.passwordKey);
  },

  get AUTH_SUCCESS_URL_PATH(): string | undefined {
    return process.env.AUTH_SUCCESS_URL_PATH?.trim() || undefined;
  },

  get AUTH_LOGIN_URL_PATH(): string | undefined {
    return process.env.AUTH_LOGIN_URL_PATH?.trim() || undefined;
  },

  get AUTH_SUCCESS_TEXT(): string | undefined {
    return process.env.AUTH_SUCCESS_TEXT?.trim() || undefined;
  },
} as const;

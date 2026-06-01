/**
 * Typed environment variable reader with validation.
 *
 * Port dari Python config/settings.py — semua env vars diakses melalui
 * module ini untuk konsistensi dan fail-fast jika config tidak lengkap.
 */

// ── Private Helpers ────────────────────────────────────────────────────────

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

// ── Public Config Object ───────────────────────────────────────────────────

export const env = {
  /** Full URL aplikasi yang akan ditest */
  get BASE_URL(): string {
    return requireEnv('BASE_URL');
  },

  /** Environment name: dev | stg | prod */
  get ENV_NAME(): string {
    return requireEnv('ENV_NAME', 'dev');
  },

  /** Email/username akun QA test — validated as non-placeholder */
  get USER_EMAIL(): string {
    return requireSecretEnv('TEST_USER_EMAIL');
  },

  /** Password akun QA test — validated as non-placeholder */
  get USER_PASSWORD(): string {
    return requireSecretEnv('TEST_USER_PASSWORD');
  },
} as const;

/**
 * Modul pembaca dan validator Environment Variable secara type-safe.
 *
 * Menyediakan akses terpusat ke semua konfigurasi lingkungan (.env)
 * dengan validasi fail-fast untuk mendeteksi variabel yang hilang atau salah konfigurasi.
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

  /** Email akun QA test — validated as non-placeholder */
  get USER_EMAIL(): string {
    return requireSecretEnv('TEST_USER_EMAIL');
  },

  /** Username akun QA test — optional; falls back to undefined for repos that
   *  only carry the legacy EMAIL/PASSWORD secrets. */
  get USER_USERNAME(): string | undefined {
    return optionalSecretEnv('TEST_USER_USERNAME');
  },

  /** Nomor Telepon akun QA test — optional; falls back to undefined for repos
   *  that only carry the legacy EMAIL/PASSWORD secrets. */
  get USER_PHONE(): string | undefined {
    return optionalSecretEnv('TEST_USER_PHONE');
  },

  /** Password akun QA test — validated as non-placeholder */
  get USER_PASSWORD(): string {
    return requireSecretEnv('TEST_USER_PASSWORD');
  },

  /** ── Konfigurasi Auth Setup (Opsional) ── */

  /** Jalur URL yang menandakan login berhasil (wajib untuk auth setup) */
  get AUTH_SUCCESS_URL_PATH(): string | undefined {
    return process.env.AUTH_SUCCESS_URL_PATH?.trim() || undefined;
  },

  /** Jalur URL halaman login (wajib untuk auth setup) */
  get AUTH_LOGIN_URL_PATH(): string | undefined {
    return process.env.AUTH_LOGIN_URL_PATH?.trim() || undefined;
  },

  /** Teks yang muncul setelah berhasil login (wajib untuk auth setup) */
  get AUTH_SUCCESS_TEXT(): string | undefined {
    return process.env.AUTH_SUCCESS_TEXT?.trim() || undefined;
  },
} as const;

/// <reference types="node" />
/**
 * Pure helpers for env-edit CLI — role ↔ env key naming (no I/O).
 *
 * Convention (source of truth = setup wizard):
 * - default/user → TEST_USER_EMAIL / TEST_USER_PASSWORD → .auth/user.json
 * - finance      → FINANCE_EMAIL / FINANCE_PASSWORD     → .auth/finance.json
 * - super-admin  → SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD → .auth/super-admin.json
 *
 * @module scripts/env-edit-lib
 */

export interface RoleCredentialRef {
  /** Role name kebab-case, or 'user' for default TEST_USER_* */
  name: string;
  authFile: string;
  emailKey: string;
  passwordKey: string;
  usernameKey?: string;
  phoneKey?: string;
}

/** Role name: lowercase letters, digits, hyphens only. */
export function isValidRoleName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name.trim());
}

/**
 * Map role name to env key prefix.
 * default|user → TEST_USER; super-admin → SUPER_ADMIN
 */
export function roleToEnvPrefix(roleName: string): string {
  const n = roleName.trim().toLowerCase();
  if (n === 'default' || n === 'user') return 'TEST_USER';
  return n.toUpperCase().replace(/-/g, '_');
}

/**
 * Map env prefix back to role name used in auth files.
 * TEST_USER → user; SUPER_ADMIN → super-admin
 */
export function envPrefixToRole(prefix: string): string {
  const p = prefix.trim().toUpperCase();
  if (p === 'TEST_USER') return 'user';
  return p.toLowerCase().replace(/_/g, '-');
}

/**
 * Auth storage path for a role.
 * default|user → .auth/user.json
 */
export function roleAuthFile(roleName: string): string {
  const n = roleName.trim().toLowerCase();
  if (n === 'default' || n === 'user') return '.auth/user.json';
  return `.auth/${n}.json`;
}

/** Build credential key refs for a role name. */
export function roleCredentialKeys(roleName: string): RoleCredentialRef {
  const name = roleName.trim().toLowerCase() === 'default' ? 'user' : roleName.trim().toLowerCase();
  const prefix = roleToEnvPrefix(name);
  const ref: RoleCredentialRef = {
    name,
    authFile: roleAuthFile(name),
    emailKey: `${prefix}_EMAIL`,
    passwordKey: `${prefix}_PASSWORD`,
  };
  if (prefix === 'TEST_USER') {
    ref.usernameKey = 'TEST_USER_USERNAME';
    ref.phoneKey = 'TEST_USER_PHONE';
  }
  return ref;
}

/**
 * Discover roles from a flat env map (decrypted KEY→value).
 * Includes user when TEST_USER_EMAIL is present.
 * Scans *_EMAIL keys (excluding TEST_USER handled above).
 */
export function parseRolesFromEnvMap(map: Record<string, string>): RoleCredentialRef[] {
  const roles: RoleCredentialRef[] = [];
  const seen = new Set<string>();

  if (map.TEST_USER_EMAIL !== undefined && map.TEST_USER_EMAIL !== '') {
    const r = roleCredentialKeys('user');
    roles.push(r);
    seen.add(r.name);
  }

  for (const key of Object.keys(map)) {
    const m = /^([A-Z0-9_]+)_EMAIL$/.exec(key);
    if (!m) continue;
    const prefix = m[1];
    if (prefix === 'TEST_USER') continue;
    if (prefix === 'DOTENV_PUBLIC_KEY') continue;
    const roleName = envPrefixToRole(prefix);
    if (seen.has(roleName)) continue;
    // Skip empty values
    if (!map[key] || map[key].trim() === '') continue;
    const r = roleCredentialKeys(roleName);
    roles.push(r);
    seen.add(roleName);
  }

  return roles.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Mask secrets for display.
 * encrypted:… → [encrypted]
 * short values → ***
 * longer → first2 + **** + last2
 */
export function maskSecret(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '(empty)';
  if (value.startsWith('encrypted:')) return '[encrypted]';
  if (value.length <= 4) return '****';
  if (value.length <= 8) return value.slice(0, 1) + '****' + value.slice(-1);
  return value.slice(0, 2) + '****' + value.slice(-2);
}

/**
 * Normalize a value for dotenv line format.
 * Newlines break KEY=value files — reject them (caller should validate UX).
 */
export function assertSingleLineEnvValue(key: string, val: string): void {
  if (/[\r\n]/.test(val)) {
    throw new Error(
      `Nilai untuk ${key} tidak boleh mengandung baris baru (newline). Gunakan password satu baris.`,
    );
  }
}

/** Upsert KEY=value lines in env file content; preserve other lines. */
export function upsertEnvContent(
  content: string,
  values: Record<string, string>,
  sectionComment?: string,
): string {
  let next = content.endsWith('\n') || content === '' ? content : content + '\n';
  let addedSection = false;

  for (const [key, val] of Object.entries(values)) {
    assertSingleLineEnvValue(key, val);
    const regex = new RegExp(`^${escapeRegExp(key)}=.*$`, 'm');
    const line = `${key}=${encodeEnvValue(val)}`;
    if (regex.test(next)) {
      next = next.replace(regex, line);
    } else {
      if (sectionComment && !addedSection) {
        next += `\n# ${sectionComment}\n`;
        addedSection = true;
      }
      next += line + '\n';
    }
  }
  return next;
}

/**
 * Encode a value for a dotenv line.
 * - Prefer single quotes when value has `$`, backtick, or `"` so dotenv/dotenvx
 *   will not expand variables (passwords often contain `$`).
 * - Use double quotes when value has single quotes / spaces / # / = without `$`.
 * - Plain when safe.
 */
export function encodeEnvValue(val: string): string {
  const needsAnyQuote = /[\s#"'$`]/.test(val) || val.includes('=') || val.includes('\\');

  if (!needsAnyQuote) return val;

  // Single-quoted dotenv values are literal (except we cannot embed a raw ').
  if (!val.includes("'")) {
    return `'${val}'`;
  }

  // Fall back to double quotes with escapes for \, ", and $ (prevent expansion).
  const escaped = val
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  return `"${escaped}"`;
}

/** Remove keys from env file content (whole lines). */
export function removeEnvKeys(content: string, keys: string[]): string {
  let next = content;
  for (const key of keys) {
    const regex = new RegExp(`^${escapeRegExp(key)}=.*\\r?\\n?`, 'gm');
    next = next.replace(regex, '');
  }
  // collapse triple newlines
  return next.replace(/\n{3,}/g, '\n\n');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parse KEY=VALUE lines from dotenv-style text (no expansion). */
export function parseEnvText(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1);
    // strip surrounding quotes + basic escapes for double-quoted values
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val
        .slice(1, -1)
        .replace(/\\\$/g, '$')
        .replace(/\\`/g, '`')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (val.startsWith("'") && val.endsWith("'") && val.length >= 2) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

export function isEncryptedEnvText(text: string): boolean {
  return text.includes('encrypted:');
}

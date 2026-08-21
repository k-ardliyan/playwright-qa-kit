/// <reference types="node" />
/**
 * Pure helpers for env-edit CLI — role ↔ env key naming + dotenv text utils.
 *
 * Credential schema lives in src/shared/utils/role-credentials.ts (re-exported here).
 *
 * @module scripts/env-edit-lib
 */

export {
  type LoginIdKind,
  type RoleCredentialRef,
  type ResolvedLoginId,
  type ResolveLoginIdResult,
  type WizardRoleInput,
  type NormalizeWizardRolesResult,
  canonicalRoleName,
  isValidRoleName,
  roleToEnvPrefix,
  envPrefixToRole,
  roleAuthFile,
  roleCredentialKeys,
  isRoleLoginReady,
  resolveLoginIdentifier,
  roleFieldsToEnvUpserts,
  normalizeWizardRoles,
  parseRolesFromEnvMap,
  hasDefaultUserCredentials,
} from '../../src/shared/utils/role-credentials';

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

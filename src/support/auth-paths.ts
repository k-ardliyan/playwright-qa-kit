/**
 * Auth storage paths scoped by APP_ENV.
 *
 * Preferred:  .auth/{APP_ENV}/{role}.json
 * Legacy (local only): .auth/{role}.json — used as read fallback; migrateLegacyAuthFiles copies once
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export function currentAppEnv(): string {
  const v = (process.env.APP_ENV ?? 'local').trim();
  return v.length > 0 ? v : 'local';
}

/**
 * Resolve path for a role's storage state (read path with legacy fallback).
 * @param role kebab-case role name (`user`, `finance`, `super-admin`)
 * @param appEnv defaults to process.env.APP_ENV || 'local'
 */
export function authStatePath(role: string, appEnv = currentAppEnv()): string {
  const r =
    role.trim().toLowerCase() === 'default' || role.trim().toLowerCase() === 'general'
      ? 'user'
      : role.trim().toLowerCase();
  const scoped = path.join('.auth', appEnv, `${r}.json`);
  const legacy = path.join('.auth', `${r}.json`);

  if (fs.existsSync(scoped)) return scoped;
  // Read-compat: only local may reuse unscoped legacy files
  if (appEnv === 'local' && fs.existsSync(legacy)) return legacy;
  return scoped;
}

/** Preferred write path (always scoped; no legacy). */
export function authStateWritePath(role: string, appEnv = currentAppEnv()): string {
  const r =
    role.trim().toLowerCase() === 'default' || role.trim().toLowerCase() === 'general'
      ? 'user'
      : role.trim().toLowerCase();
  return path.join('.auth', appEnv, `${r}.json`);
}

export function ensureAuthDirForEnv(appEnv = currentAppEnv()): string {
  const dir = path.join('.auth', appEnv);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Copy legacy `.auth/{role}.json` → `.auth/local/{role}.json` when scoped missing.
 * Idempotent; only runs for APP_ENV=local (or when appEnv arg is local).
 */
export function migrateLegacyAuthFiles(appEnv = currentAppEnv()): string[] {
  if (appEnv !== 'local') return [];
  const root = path.join('.auth');
  if (!fs.existsSync(root)) return [];

  ensureAuthDirForEnv('local');
  const moved: string[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    if (entry.name.endsWith('.bak')) continue;
    const legacy = path.join(root, entry.name);
    const scoped = path.join(root, 'local', entry.name);
    if (fs.existsSync(scoped)) continue;
    try {
      fs.copyFileSync(legacy, scoped);
      moved.push(entry.name);
    } catch {
      // non-fatal
    }
  }
  if (moved.length > 0) {
    console.log(`ℹ [Auth] Migrated legacy auth files to .auth/local/: ${moved.join(', ')}`);
  }
  return moved;
}

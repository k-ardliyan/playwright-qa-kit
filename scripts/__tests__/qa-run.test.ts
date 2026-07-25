/**
 * Integration tests for scripts/qa-run.ts (single-command CLI wrapper).
 *
 * Tests the argv parser + preflight + prompt builder in isolation,
 * tanpa spawn process. CLI end-to-end di-skip di test (butuh TTY).
 */

import { describe, test as it, expect } from '@playwright/test';

// qa-run.ts tidak export functions-nya — pakai spawn-based smoke test minimal.
// Untuk unit-testable pieces, kita parse output dari --help saja.

import { execSync } from 'node:child_process';
import * as path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');
const qaRunCli = path.join(repoRoot, 'scripts', 'qa-run.ts');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

describe('qa:run CLI', () => {
  it('--help prints usage with options', () => {
    // execSync kalau exit != 0 throws — kita tolerate dan parse stdout dari error.
    let out: string;
    try {
      out = execSync(`${tsxBin} ${qaRunCli} --help`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e: unknown) {
      out = (e as { stdout?: string }).stdout ?? '';
    }

    expect(out).toContain('Usage:');
    expect(out).toContain('--skip-prompt');
    expect(out).toContain('--dry-run');
    expect(out).toContain('--no-confirm');
    expect(out).toContain('--open-dashboard');
    expect(out).toContain('--no-open-dashboard');
  });

  it('no args exits with usage error', () => {
    let exitCode = -1;
    let stderr = '';
    try {
      execSync(`${tsxBin} ${qaRunCli}`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e: unknown) {
      const err = e as { status?: number; stderr?: string };
      exitCode = err.status ?? -1;
      stderr = err.stderr ?? '';
    }

    expect(exitCode).not.toBe(0);
    expect(stderr.toLowerCase()).toMatch(/(usage|tidak ada|not found)/);
  });

  it('non-existent requirement file exits with friendly error', () => {
    let exitCode = -1;
    let stderr = '';
    try {
      execSync(`${tsxBin} ${qaRunCli} requirements/__nonexistent__.md --dry-run`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e: unknown) {
      const err = e as { status?: number; stderr?: string };
      exitCode = err.status ?? -1;
      stderr = err.stderr ?? '';
    }

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('tidak ditemukan');
  });
});

describe('exit-codes module', () => {
  it('exports 4 standard codes', async () => {
    const ec = await import('../exit-codes');
    expect(ec.EXIT.OK).toBe(0);
    expect(ec.EXIT.FIXABLE).toBe(1);
    expect(ec.EXIT.ESCALATE).toBe(2);
    expect(ec.EXIT.USAGE).toBe(3);
  });

  it('exitCodeFromName resolves strings', async () => {
    const ec = await import('../exit-codes');
    expect(ec.exitCodeFromName('OK')).toBe(ec.EXIT.OK);
    expect(ec.exitCodeFromName('FIXABLE')).toBe(ec.EXIT.FIXABLE);
    expect(ec.exitCodeFromName('0')).toBe(ec.EXIT.OK);
    expect(ec.exitCodeFromName('UNKNOWN')).toBeUndefined();
  });
});

describe('format-error module', () => {
  it('FriendlyErrorInstance carries exitCode', async () => {
    const fe = await import('../format-error');
    const inst = fe.friendly({
      title: 'test',
      detail: 'detail',
      exitCode: fe.EXIT?.FIXABLE ?? 1,
    });
    expect(inst.exitCode).toBe(1);
    expect(inst.friendly.title).toBe('test');
  });

  it('formatErrorString produces multiline output', async () => {
    const fe = await import('../format-error');
    const out = fe.formatErrorString({
      title: 'X',
      detail: 'Y',
      hint: 'Z',
      docsLink: 'docs/A',
    });
    expect(out).toContain('X');
    expect(out).toContain('Y');
    expect(out).toContain('💡 Z');
    expect(out).toContain('📖 docs/A');
  });
});

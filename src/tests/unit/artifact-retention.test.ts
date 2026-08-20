import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { applyArtifactRetention, RetentionPolicyOptions } from '../../shared/evidence/retention';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pw-retention-'));
}

function bumpMtime(file: string, daysBack: number): void {
  const old = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  fs.utimesSync(file, old, old);
}

test.describe('Artifact retention policy (MCP-085)', () => {
  test('returns an empty result when the directory is absent', () => {
    const r = applyArtifactRetention(path.join(os.tmpdir(), 'does-not-exist-____'));
    expect(r.deletedFiles).toEqual([]);
    expect(r.retainedCount).toBe(0);
    expect(r.freedBytes).toBe(0);
  });

  test('deletes files older than maxAgeDays and reports freed bytes', () => {
    const dir = makeTmpDir();
    try {
      const stale = path.join(dir, 'stale.trace.zip');
      fs.writeFileSync(stale, 'x'.repeat(4096)); // 4 KiB
      bumpMtime(stale, 30); // older than default 14d

      const opts: RetentionPolicyOptions = { maxAgeDays: 14 };
      const r = applyArtifactRetention(dir, opts);

      expect(fs.existsSync(stale)).toBe(false);
      expect(r.deletedFiles).toContain(stale);
      expect(r.freedBytes).toBe(4096);
      expect(r.retainedCount).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('retains fresh files and honors an explicit maxAgeDays', () => {
    const dir = makeTmpDir();
    try {
      const fresh = path.join(dir, 'fresh.png');
      fs.writeFileSync(fresh, 'f');
      bumpMtime(fresh, 2); // within default 14d

      const old = path.join(dir, 'old.json');
      fs.writeFileSync(old, 'o');
      bumpMtime(old, 40);

      const r = applyArtifactRetention(dir, { maxAgeDays: 30 });

      expect(fs.existsSync(fresh)).toBe(true);
      expect(fs.existsSync(old)).toBe(false);
      expect(r.retainedCount).toBe(1);
      expect(r.deletedFiles).toEqual([old]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

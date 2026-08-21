import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  resolveInstalledPlaywrightMcpVersionSync,
  resolveInstalledPlaywrightMcpVersion,
} from '../../shared/mcp/version-resolver';

test.describe('MCP Version Resolver (MCP-004)', () => {
  test('returns installed version when package exists', async () => {
    const versionSync = resolveInstalledPlaywrightMcpVersionSync();
    const versionAsync = await resolveInstalledPlaywrightMcpVersion();

    expect(typeof versionSync === 'string' || versionSync === null).toBe(true);
    expect(versionSync).toBe(versionAsync);
  });

  test('returns null when package is unavailable', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-missing-'));
    try {
      const res = resolveInstalledPlaywrightMcpVersionSync(tempDir);
      expect(res).toBeNull();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('returns null when package metadata is malformed', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-malformed-'));
    try {
      const pkgDir = path.join(tempDir, 'node_modules', '@playwright', 'mcp');
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(path.join(pkgDir, 'package.json'), '{ "version": 123 }'); // invalid string

      const res = resolveInstalledPlaywrightMcpVersionSync(tempDir);
      expect(res).toBeNull();

      // corrupted JSON
      fs.writeFileSync(path.join(pkgDir, 'package.json'), '{ invalid json');
      expect(resolveInstalledPlaywrightMcpVersionSync(tempDir)).toBeNull();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

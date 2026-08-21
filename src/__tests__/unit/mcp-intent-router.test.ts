import { test, expect } from '@playwright/test';
import { validateBrowserIntent } from '../../shared/mcp/intent-validator';
import { resolveMcpProfileFromIntent } from '../../shared/mcp/intent-router';

test.describe('Browser Intent Routing (MCP-019, MCP-020)', () => {
  test('validates and normalizes valid browser intent', () => {
    const raw = {
      requires: { network: true, storage: 'true', dialog: false },
      viewport: { width: 1280, height: 720 },
      mode: 'semantic',
    };

    const res = validateBrowserIntent(raw);
    expect(res.valid).toBe(true);
    expect(res.intent.requires?.network).toBe(true);
    expect(res.intent.requires?.storage).toBe(true);
    expect(res.intent.requires?.dialog).toBe(false);
    expect(res.intent.viewport).toEqual({ width: 1280, height: 720 });
  });

  test('routes standard form scenario to author profile without network', () => {
    const route = resolveMcpProfileFromIntent({
      requires: { storage: true },
    });

    expect(route.profile).toBe('author');
    expect(route.capabilities).toContain('testing');
    expect(route.capabilities).toContain('storage');
    expect(route.capabilities).not.toContain('network');
    expect(route.isolated).toBe(true);
  });

  test('routes API error scenario to author profile with network capability', () => {
    const route = resolveMcpProfileFromIntent({
      requires: { network: true },
    });

    expect(route.profile).toBe('author');
    expect(route.capabilities).toContain('network');
    expect(route.capabilities).toContain('testing');
  });

  test('routes visual/canvas scenario to visual profile', () => {
    const route = resolveMcpProfileFromIntent({
      requires: { vision: true },
    });

    expect(route.profile).toBe('visual');
    expect(route.capabilities).toContain('vision');
  });

  test('routes devtools scenario to debug profile', () => {
    const route = resolveMcpProfileFromIntent({
      requires: { devtools: true },
    });

    expect(route.profile).toBe('debug');
    expect(route.capabilities).toContain('devtools');
    expect(route.capabilities).toContain('network');
  });
});

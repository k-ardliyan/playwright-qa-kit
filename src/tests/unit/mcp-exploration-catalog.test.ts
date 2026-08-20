import { test, expect } from '@playwright/test';
import { evaluateCatalogFreshness, type CatalogMetadata } from '../../shared/mcp/catalog-evaluator';
import { shouldExploreLive } from '../../shared/mcp/exploration-policy';

test.describe('MCP Catalog Freshness & Live Exploration Policy', () => {
  test('evaluateCatalogFreshness handles legacy or invalid metadata', () => {
    expect(evaluateCatalogFreshness(null).status).toBe('unknown');
    expect(evaluateCatalogFreshness({} as CatalogMetadata).status).toBe('unknown');
    expect(evaluateCatalogFreshness({ environment: 'dev' }).status).toBe('unknown');
    expect(evaluateCatalogFreshness({ capturedAt: 'invalid-date-string' }).status).toBe('unknown');
  });

  test('evaluateCatalogFreshness detects environment, role, and signature mismatches', () => {
    const freshTimestamp = new Date().toISOString();

    const envMismatch = evaluateCatalogFreshness(
      { capturedAt: freshTimestamp, environment: 'staging' },
      { currentEnvironment: 'dev' },
    );
    expect(envMismatch.status).toBe('stale');
    expect(envMismatch.reason).toContain('environment (staging)');

    const roleMismatch = evaluateCatalogFreshness(
      { capturedAt: freshTimestamp, authRole: 'finance' },
      { currentRole: 'admin' },
    );
    expect(roleMismatch.status).toBe('stale');
    expect(roleMismatch.reason).toContain('auth role (finance)');

    const sigMismatch = evaluateCatalogFreshness(
      { capturedAt: freshTimestamp, pageSignature: 'sig_v1' },
      { expectedPageSignature: 'sig_v2' },
    );
    expect(sigMismatch.status).toBe('stale');
    expect(sigMismatch.reason).toContain('signature mismatch');
  });

  test('evaluateCatalogFreshness evaluates timestamp age', () => {
    const oldTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const staleResult = evaluateCatalogFreshness(
      { capturedAt: oldTimestamp },
      { maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
    );
    expect(staleResult.status).toBe('stale');

    const recentTimestamp = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const freshResult = evaluateCatalogFreshness(
      { capturedAt: recentTimestamp },
      { maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
    );
    expect(freshResult.status).toBe('fresh');
  });

  test('shouldExploreLive requires live exploration for healer retry, new feature, and dynamic intent', () => {
    expect(shouldExploreLive({ isHealerRetry: true }).shouldExplore).toBe(true);
    expect(shouldExploreLive({ isNewFeature: true }).shouldExplore).toBe(true);

    expect(shouldExploreLive({ intent: { requires: { network: true } } }).shouldExplore).toBe(true);
    expect(shouldExploreLive({ intent: { requires: { vision: true } } }).shouldExplore).toBe(true);
    expect(shouldExploreLive({ intent: { requires: { dialog: true } } }).shouldExplore).toBe(true);
    expect(shouldExploreLive({ intent: { requires: { multiTab: true } } }).shouldExplore).toBe(
      true,
    );
    expect(shouldExploreLive({ intent: { requires: { fileUpload: true } } }).shouldExplore).toBe(
      true,
    );
  });

  test('shouldExploreLive skips live exploration when verified POM or fresh catalog is available', () => {
    expect(
      shouldExploreLive({
        hasExistingPom: true,
        catalogFreshness: { status: 'fresh', reason: 'ok' },
      }).shouldExplore,
    ).toBe(false);

    expect(
      shouldExploreLive({
        hasExistingPom: true,
      }).shouldExplore,
    ).toBe(false);

    expect(
      shouldExploreLive({
        catalogFreshness: { status: 'fresh', reason: 'ok' },
      }).shouldExplore,
    ).toBe(false);
  });
});

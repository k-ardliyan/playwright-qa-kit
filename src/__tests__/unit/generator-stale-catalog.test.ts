import { test, expect } from '@playwright/test';
import { LiveVerificationGate } from '../../agents/generator/live-verification-gate';
import { evaluateCatalogFreshness } from '../../shared/mcp/catalog-evaluator';
import { adaptOfficialGeneratedLocator } from '../../shared/mcp/locator-generator-adapter';
import { resolveLocatorPriority } from '../../shared/mcp/locator-priority';
import type { LocatorCandidate } from '../../shared/types/locator-candidate.types';

test.describe('Generator Integration: Stale Selector Catalog (MCP-044)', () => {
  test('detects stale catalog and reconciles with newly generated semantic locators', () => {
    // 1. Catalog is 30 days old (stale)
    const oldCapturedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const staleCatalogMetadata = {
      capturedAt: oldCapturedAt,
      environment: 'dev',
      authRole: 'user',
      locators: [{ name: 'oldButton', selector: '#old-btn-id' }],
    };

    const freshness = evaluateCatalogFreshness(staleCatalogMetadata, {
      currentEnvironment: 'dev',
      currentRole: 'user',
      maxAgeMs: 7 * 24 * 60 * 60 * 1000,
    });
    expect(freshness.status).toBe('stale');

    // 2. Old catalog candidate vs new live generated candidate
    const oldCatalogCandidate: LocatorCandidate = {
      strategy: 'catalog',
      selector: '#old-btn-id',
      source: 'catalog',
      confidence: 0.5, // degraded confidence due to staleness
    };

    const liveGeneratedCandidate = adaptOfficialGeneratedLocator({
      locator: "page.getByRole('button', { name: 'Save Changes' })",
      role: 'button',
      name: 'Save Changes',
      confidence: 0.95,
    });

    const priority = resolveLocatorPriority([oldCatalogCandidate, liveGeneratedCandidate]);
    // 70 * 0.95 = 66.5 vs 80 * 0.5 = 40.0 -> live generated semantic role wins!
    expect(priority.best?.strategy).toBe('role');
    expect(priority.best?.selector).toContain('Save Changes');

    // 3. Evaluate through LiveVerificationGate
    const gateResult = LiveVerificationGate.evaluate({
      scenarioId: 'STALE-CAT-001',
      catalogMetadata: staleCatalogMetadata,
      discoveredCandidates: [liveGeneratedCandidate],
    });

    expect(gateResult.verified).toBe(true);
    expect(gateResult.locatorCandidates[0].strategy).toBe('role');
  });
});

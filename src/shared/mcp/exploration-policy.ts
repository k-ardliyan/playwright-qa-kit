import type { BrowserIntent } from '../types/browser-intent.types';
import type { CatalogFreshnessResult } from './catalog-evaluator';

export interface ExplorationDecisionInput {
  hasExistingPom?: boolean;
  catalogFreshness?: CatalogFreshnessResult;
  intent?: BrowserIntent;
  isHealerRetry?: boolean;
  isNewFeature?: boolean;
}

export interface ExplorationDecision {
  shouldExplore: boolean;
  reason: string;
}

/**
 * Determine whether Generator should perform live browser exploration before generating code.
 */
export function shouldExploreLive(input: ExplorationDecisionInput): ExplorationDecision {
  if (input.isHealerRetry) {
    return {
      shouldExplore: true,
      reason: 'Live exploration required for Healer failure reproduction and verification',
    };
  }

  if (input.isNewFeature) {
    return {
      shouldExplore: true,
      reason:
        'Live exploration required to discover selectors and verify acceptance criteria for new feature',
    };
  }

  const reqs = input.intent?.requires ?? {};
  if (reqs.vision || reqs.network || reqs.dialog || reqs.multiTab || reqs.fileUpload) {
    return {
      shouldExplore: true,
      reason:
        'Live exploration required for dynamic browser interaction (network/dialog/tabs/files/vision)',
    };
  }

  if (input.catalogFreshness?.status === 'stale') {
    return {
      shouldExplore: true,
      reason: `Live exploration required because selector catalog is stale: ${input.catalogFreshness.reason}`,
    };
  }

  if (input.hasExistingPom && input.catalogFreshness?.status === 'fresh') {
    return {
      shouldExplore: false,
      reason: 'Skipping live exploration: Verified POM and fresh selector catalog are available',
    };
  }

  if (input.hasExistingPom) {
    return {
      shouldExplore: false,
      reason: 'Skipping live exploration: Reliable POM exists for standard deterministic flow',
    };
  }

  if (input.catalogFreshness?.status === 'fresh') {
    return {
      shouldExplore: false,
      reason: 'Skipping live exploration: Selector catalog is fresh and covers required selectors',
    };
  }

  return {
    shouldExplore: true,
    reason:
      'Live exploration recommended to confirm locator semantics against active application UI',
  };
}

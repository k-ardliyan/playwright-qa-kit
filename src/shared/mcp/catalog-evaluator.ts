export interface CatalogMetadata {
  url?: string;
  capturedAt?: string;
  pageSignature?: string;
  environment?: string;
  authRole?: string;
  source?: 'custom-snapshot' | 'live-mcp' | 'crawl' | string;
  locators?: unknown[];
}

export type CatalogFreshnessStatus = 'fresh' | 'stale' | 'unknown';

export interface CatalogFreshnessResult {
  status: CatalogFreshnessStatus;
  reason: string;
  ageMs?: number;
}

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Evaluate selector catalog freshness based on capturedAt timestamp, environment, and role.
 */
export function evaluateCatalogFreshness(
  metadata?: CatalogMetadata | null,
  options: {
    maxAgeMs?: number;
    currentEnvironment?: string;
    currentRole?: string;
    expectedPageSignature?: string;
  } = {},
): CatalogFreshnessResult {
  if (!metadata || typeof metadata !== 'object') {
    return {
      status: 'unknown',
      reason: 'No catalog metadata available',
    };
  }

  if (
    options.currentEnvironment &&
    metadata.environment &&
    metadata.environment !== options.currentEnvironment
  ) {
    return {
      status: 'stale',
      reason: `Catalog environment (${metadata.environment}) does not match current environment (${options.currentEnvironment})`,
    };
  }

  if (options.currentRole && metadata.authRole && metadata.authRole !== options.currentRole) {
    return {
      status: 'stale',
      reason: `Catalog auth role (${metadata.authRole}) does not match current role (${options.currentRole})`,
    };
  }

  if (
    options.expectedPageSignature &&
    metadata.pageSignature &&
    metadata.pageSignature !== options.expectedPageSignature
  ) {
    return {
      status: 'stale',
      reason: `Page signature mismatch (catalog: ${metadata.pageSignature}, expected: ${options.expectedPageSignature})`,
    };
  }

  if (!metadata.capturedAt) {
    return {
      status: 'unknown',
      reason: 'Legacy catalog without capturedAt timestamp',
    };
  }

  const capturedTime = new Date(metadata.capturedAt).getTime();
  if (isNaN(capturedTime)) {
    return {
      status: 'unknown',
      reason: `Invalid capturedAt timestamp format: ${metadata.capturedAt}`,
    };
  }

  const ageMs = Date.now() - capturedTime;
  const maxAge = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

  if (ageMs > maxAge) {
    return {
      status: 'stale',
      reason: `Catalog is ${Math.round(ageMs / (1000 * 60 * 60 * 24))} days old (max allowed: ${Math.round(maxAge / (1000 * 60 * 60 * 24))} days)`,
      ageMs,
    };
  }

  return {
    status: 'fresh',
    reason: 'Catalog is fresh and matches current context',
    ageMs,
  };
}

/**
 * Seed heal patterns for official Playwright power failures (network / hybrid / env).
 * Healer agents should call `ensurePowerSeedPatterns(db)` after loadDatabase().
 */

import type { FailureSignature, FixTemplate } from '@/shared/types';
import type { HealPatternDatabase } from '@/shared/types/heal-patterns.schema';
import { findBySignature, storePattern } from './pattern-database';

interface SeedDef {
  signature: FailureSignature;
  fix: FixTemplate;
  tags: string[];
}

const SEEDS: SeedDef[] = [
  {
    signature: {
      errorType: 'network',
      errorPattern: 'net::ERR_|NS_ERROR_FAILURE|Failed to fetch|NetworkError|ECONNREFUSED',
    },
    fix: {
      strategy: 'add_state_setup',
      beforePattern: 'await page.goto',
      afterTemplate:
        "await mockServerError(page, '**/api/**', 500);\n// or mockJson for controlled payloads\nawait page.goto",
      requiredImports: ["import { mockServerError, mockJson, unmockAll } from '@/support/pw';"],
    },
    tags: ['network', 'route', 'power'],
  },
  {
    signature: {
      errorType: 'network',
      errorPattern: 'Timeout.*waiting for.*(response|request)|api.*500|Internal Server Error',
    },
    fix: {
      strategy: 'add_state_setup',
      beforePattern: 'page.click',
      afterTemplate:
        "await mockJson(page, '**/api/**', { ok: true });\n// ensure UI action after route is registered\n",
      requiredImports: ["import { mockJson, unmockAll } from '@/support/pw';"],
    },
    tags: ['network', 'timeout', 'power'],
  },
  {
    signature: {
      errorType: 'data_state',
      errorPattern: 'not found|404|empty list|no rows|seed|missing.*data',
    },
    fix: {
      strategy: 'add_state_setup',
      beforePattern: 'await page.goto',
      afterTemplate:
        "const seeded = await apiSeed(request, '/api/<resource>', { /* payload from requirement */ });\nawait page.goto",
      requiredImports: ["import { apiSeed, apiCleanup } from '@/support/pw';"],
    },
    tags: ['hybrid', 'data_state', 'power'],
  },
  {
    signature: {
      errorType: 'auth',
      errorPattern: 'storageState|login|unauthorized|401|403|AUTH SETUP|session',
    },
    fix: {
      strategy: 'add_state_setup',
      beforePattern: 'test.describe(',
      afterTemplate:
        "test.use({ storageState: '.auth/<role>.json' });\n// ensure setup project ran: npx playwright test src/support/auth.setup.ts --project=setup\ntest.describe(",
      requiredImports: [],
    },
    tags: ['auth', 'env', 'power'],
  },
];

/**
 * Idempotently seed power-related patterns into the heal database.
 * Only inserts missing signatures — does not inflate success counts on re-run.
 */
export function ensurePowerSeedPatterns(db: HealPatternDatabase): HealPatternDatabase {
  let next = db;
  for (const seed of SEEDS) {
    if (findBySignature(next, seed.signature)) {
      continue;
    }
    next = storePattern(next, seed.signature, seed.fix, true);
    const match = next.patterns.find(
      (p) =>
        p.signature.errorType === seed.signature.errorType &&
        p.signature.errorPattern === seed.signature.errorPattern,
    );
    if (match) {
      match.tags = [...new Set([...(match.tags ?? []), ...seed.tags])];
    }
  }
  return next;
}

export function listPowerSeedSignatures(): FailureSignature[] {
  return SEEDS.map((s) => s.signature);
}

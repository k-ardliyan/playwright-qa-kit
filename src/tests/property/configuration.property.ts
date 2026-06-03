/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 12: Configuration Placeholder Warning

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { isPlaceholderJiraDomain, warnIfPlaceholderJiraDomain } from '../../utils/configuration';

function shouldWarnExpected(domain: string): boolean {
  return domain.includes('your-company') || domain.includes('example');
}

function runWarning(domain: string): { warned: boolean; callCount: number } {
  const originalWarn = console.warn;
  let callCount = 0;

  console.warn = () => {
    callCount += 1;
  };

  try {
    const warned = warnIfPlaceholderJiraDomain(domain);
    return { warned, callCount };
  } finally {
    console.warn = originalWarn;
  }
}

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.string(),
        fc.string().map((s) => `https://${s}.example.com`),
        fc.string().map((s) => `https://${s}-your-company.internal`),
      ),
      async (domain) => {
        const expected = shouldWarnExpected(domain);
        assert.equal(isPlaceholderJiraDomain(domain), expected);

        const { warned, callCount } = runWarning(domain);
        assert.equal(warned, expected);
        assert.equal(callCount, expected ? 1 : 0);
      },
    ),
    { numRuns: 40 },
  );

  console.log('✓ Property 12 passed: configuration placeholder warning behavior');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

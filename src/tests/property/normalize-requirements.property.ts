/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 2: Requirements Normalization Round-Trip
// Feature: playwright-ai-agent-framework, Property 3: Requirements Error Handling

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  normalizeRequirements,
  type NormalizeRequirementsOutput,
  type RequirementsContract,
} from '../../../mcp-server/src/tools/normalize-requirements';

function buildValidRequirementsText(
  title: string,
  acceptanceCriteria: string[],
  tags: string[],
): string {
  const lines: string[] = [`# ${title}`];
  for (const criterion of acceptanceCriteria) {
    lines.push(`- ${criterion}`);
  }
  if (tags.length > 0) {
    lines.push(`tags: ${tags.map((tag) => `#${tag}`).join(' ')}`);
  }
  return lines.join('\n');
}

function printContract(contract: RequirementsContract): string {
  const lines: string[] = [`id: ${contract.id}`, `# ${contract.title}`];
  for (const item of contract.acceptanceCriteria) {
    lines.push(`- ${item.description}`);
  }
  if (contract.tags.length > 0) {
    lines.push(`tags: ${contract.tags.map((tag) => `#${tag}`).join(' ')}`);
  }
  return lines.join('\n');
}

function canonicalize(contract: RequirementsContract): {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  tags: string[];
} {
  return {
    id: contract.id,
    title: contract.title,
    acceptanceCriteria: contract.acceptanceCriteria.map((item) => item.description),
    tags: [...contract.tags].sort((a, b) => a.localeCompare(b)),
  };
}

function expectSuccess(output: NormalizeRequirementsOutput): RequirementsContract {
  assert.equal(output.status, 'success');
  assert.ok(output.contract);
  return output.contract as RequirementsContract;
}

async function property2RoundTrip(): Promise<void> {
  const titleArb = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ]{2,28}$/);
  const criteriaArb = fc.array(fc.stringMatching(/^[A-Za-z0-9 ,.-]{3,60}$/), {
    minLength: 1,
    maxLength: 5,
  });
  const tagsArb = fc.uniqueArray(fc.stringMatching(/^[a-z0-9_-]{2,12}$/), {
    minLength: 0,
    maxLength: 4,
  });

  await fc.assert(
    fc.asyncProperty(titleArb, criteriaArb, tagsArb, async (title, criteria, tags) => {
      const input = buildValidRequirementsText(title.trim(), criteria, tags);

      const first = expectSuccess(normalizeRequirements(input));
      const printed = printContract(first);
      const second = expectSuccess(normalizeRequirements(printed));

      assert.deepEqual(canonicalize(second), canonicalize(first));
    }),
    { numRuns: 20 },
  );

  console.log('✓ Property 2 passed: normalize_requirements round-trip');
}

async function property3ErrorHandling(): Promise<void> {
  const invalidArb = fc.oneof(
    fc.constant(''),
    fc.constant('   \n\t   '),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `title: ${value}`),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `# ${value}`),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `- ${value}`),
  );

  await fc.assert(
    fc.asyncProperty(invalidArb, async (input) => {
      const output = normalizeRequirements(input);
      assert.equal(output.status, 'error');
      assert.ok(output.error);
      assert.equal(typeof output.error?.code, 'string');
      assert.equal((output.error?.code ?? '').length > 0, true);
      assert.equal(typeof output.error?.message, 'string');
      assert.equal((output.error?.message ?? '').length > 0, true);
    }),
    { numRuns: 20 },
  );

  console.log('✓ Property 3 passed: normalize_requirements error handling');
}

async function main(): Promise<void> {
  await property2RoundTrip();
  await property3ErrorHandling();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

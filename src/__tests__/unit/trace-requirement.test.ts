import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  traceRequirement,
  buildTraceabilityMatrix,
} from '../../../tools/mcp/src/tools/trace-requirement';
import { TRACEABILITY_SCHEMA_V1 } from '@/contracts';

test.describe('trace_requirement Graph & Matrix (Phase 9)', () => {
  const fixturesDir = path.resolve(__dirname, '../../../tests/fixtures/requirements');

  test('buildTraceabilityMatrix builds complete graph from requirement', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'auth-multi-role.md'), 'utf-8');
    const matrix = buildTraceabilityMatrix(text, 'tests/fixtures/requirements/auth-multi-role.md');

    expect(matrix.schemaVersion).toBe(TRACEABILITY_SCHEMA_V1);
    expect(matrix.requirementId).toBe('REQ-FIN-001');
    expect(matrix.module).toBe('finance');
    expect(matrix.feature).toBe('invoice-approval');
    expect(matrix.acceptanceCriteria.length).toBe(2);
    expect(matrix.scenarios.length).toBe(2);

    expect(matrix.metrics.totalAcs).toBe(2);
    expect(matrix.metrics.totalScenarios).toBe(2);
  });

  test('traceRequirement tool returns conformant MCP envelope', () => {
    const result = traceRequirement({
      requirementPath: 'tests/fixtures/requirements/minimal-public.md',
    });

    if (result.status !== 'success') {
      console.error('TRACE REQUIREMENT ERROR:', JSON.stringify(result, null, 2));
    }

    expect(result.schemaVersion).toBe('qa.mcp-result/v1');
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data?.requirementId).toBe('REQ-PUB-001');
    expect(result.data?.metrics.coveredAcs).toBe(1);
    expect(result.data?.metrics.uncoveredAcs).toBe(1);
    expect(result.data?.metrics.totalAcs).toBe(2);
  });
});

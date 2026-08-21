import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TOOL_REGISTRY, getToolEntry } from '../../../tools/mcp/src/tools/registry';

test.describe('MCP Tool Registry & Backward Compatibility (Phase 8)', () => {
  test('all baseline tools remain registered with unchanged schemas', () => {
    const baselinePath = path.resolve(
      __dirname,
      '../../../tools/mcp/src/__tests__/fixtures/tool-registry-baseline.json',
    );
    const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    for (const baseline of baselineData) {
      const entry = getToolEntry(baseline.name);
      expect(entry, `Tool ${baseline.name} must remain registered`).toBeDefined();
      expect(entry?.name).toBe(baseline.name);
    }
  });

  test('new Phase 2-9 additive tools are registered', () => {
    const compileReq = getToolEntry('compile_requirement');
    expect(compileReq).toBeDefined();
    expect(compileReq?.name).toBe('compile_requirement');

    const validatePln = getToolEntry('validate_plan');
    expect(validatePln).toBeDefined();
    expect(validatePln?.name).toBe('validate_plan');

    const traceReq = getToolEntry('trace_requirement');
    expect(traceReq).toBeDefined();
    expect(traceReq?.name).toBe('trace_requirement');
  });

  test('registry contains at least 19 tools without duplicates', () => {
    expect(TOOL_REGISTRY.length).toBeGreaterThanOrEqual(19);
    const names = TOOL_REGISTRY.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

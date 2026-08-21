import { test, expect } from '@playwright/test';
import { TOOL_REGISTRY, getToolsForProfile } from '../../../tools/mcp/src/tools/registry';

test.describe('Custom MCP Profiles & Capability Router (Phase 10)', () => {
  test('all 20+ tools are returned when profile is "all"', () => {
    const allTools = getToolsForProfile('all');
    expect(allTools.length).toBe(TOOL_REGISTRY.length);
    expect(allTools.length).toBeGreaterThanOrEqual(20);
  });

  test('author profile includes planning, generation, and exploration tools', () => {
    const authorTools = getToolsForProfile('author');
    const names = authorTools.map((t) => t.name);

    expect(names).toContain('compile_requirement');
    expect(names).toContain('compile_test_plan');
    expect(names).toContain('validate_plan');
    expect(names).toContain('validate_requirement');
    expect(names).toContain('validate_generated_tests');
    expect(names).toContain('discover_pages');
    expect(names).toContain('snapshot_page');
    expect(names).toContain('health_check');
  });

  test('debug profile includes failure diagnostics and artifact inspection', () => {
    const debugTools = getToolsForProfile('debug');
    const names = debugTools.map((t) => t.name);

    expect(names).toContain('get_test_failures');
    expect(names).toContain('get_test_summary');
    expect(names).toContain('trace_requirement');
    expect(names).toContain('inspect_file');
    expect(names).toContain('extract_pdf_text');
    expect(names).toContain('read_excel_summary');
    expect(names).toContain('health_check');
  });

  test('artifact profile focuses on file content extraction tools', () => {
    const artifactTools = getToolsForProfile('artifact');
    const names = artifactTools.map((t) => t.name);

    expect(names).toContain('inspect_file');
    expect(names).toContain('extract_pdf_text');
    expect(names).toContain('read_excel_summary');
    expect(names).toContain('health_check');
  });
});

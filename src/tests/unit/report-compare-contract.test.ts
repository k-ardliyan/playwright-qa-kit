import { test, expect } from '@playwright/test';
import { compareReports, classifyChange } from '../../agents/reporter/report-compare';
import type { ArchivedScenario } from '../../agents/reporter/report-archive';

function scenario(status: string, errorMessage?: string): ArchivedScenario {
  return {
    scenarioId: 'SC-01',
    name: 'sample scenario',
    status: status as ArchivedScenario['status'],
    errorMessage,
  };
}

test.describe('classifyChange — healed status transitions', () => {
  test('healed → passed is a FIX (healer succeeded, now green)', () => {
    const diff = classifyChange(scenario('healed'), scenario('passed'));
    expect(diff.change).toBe('fix');
  });

  test('passed → healed is UNCHANGED (still green)', () => {
    const diff = classifyChange(scenario('passed'), scenario('healed'));
    expect(diff.change).toBe('unchanged');
  });

  test('skipped → healed is a FIX (previously not run, now green)', () => {
    const diff = classifyChange(scenario('skipped'), scenario('healed'));
    expect(diff.change).toBe('fix');
  });

  test('healed → skipped is FLAKY (lost green status)', () => {
    const diff = classifyChange(scenario('healed'), scenario('skipped'));
    expect(diff.change).toBe('flaky');
  });

  test('healed → failed is a REGRESSION', () => {
    const diff = classifyChange(scenario('healed'), scenario('failed'));
    expect(diff.change).toBe('regression');
  });

  test('failed → healed is a FIX', () => {
    const diff = classifyChange(scenario('failed'), scenario('healed'));
    expect(diff.change).toBe('fix');
  });
});

test.describe('classifyChange — baseline transitions still correct', () => {
  test('passed → failed is a REGRESSION', () => {
    expect(classifyChange(scenario('passed'), scenario('failed')).change).toBe('regression');
  });

  test('failed → passed is a FIX', () => {
    expect(classifyChange(scenario('failed'), scenario('passed')).change).toBe('fix');
  });

  test('passed → passed is UNCHANGED', () => {
    expect(classifyChange(scenario('passed'), scenario('passed')).change).toBe('unchanged');
  });

  test('failed → failed with same error is STABLE', () => {
    const diff = classifyChange(scenario('failed', 'timeout'), scenario('failed', 'timeout'));
    expect(diff.change).toBe('stable');
  });

  test('failed → failed with different error is FLAKY', () => {
    const diff = classifyChange(scenario('failed', 'timeout'), scenario('failed', 'selector'));
    expect(diff.change).toBe('flaky');
  });
});

test.describe('report-compare error contract', () => {
  test('compareReports with missing run returns { error } object (truthy!)', () => {
    const result = compareReports('run-19990101-000000-000', 'run-19990102-000000-000');
    // This is the contract the server route relies on: an error result is a
    // truthy object with an `error` key — routes MUST check `'error' in result`,
    // never `!result` (which would treat the error object as success).
    expect(result).toBeTruthy();
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('not found');
    }
  });

  test('compareReports with valid runs returns ReportComparison (no error key)', () => {
    const result = compareReports('run-20260804-122732-610', 'run-20260804-132457-920');
    expect(result).toBeTruthy();
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.baselineRunId).toBe('run-20260804-122732-610');
      expect(result.comparisonRunId).toBe('run-20260804-132457-920');
      expect(typeof result.passRateDelta).toBe('number');
    }
  });

  test('compareReports swaps runs to chronological order', () => {
    // Reversed args — newer first.
    const result = compareReports('run-20260804-132457-920', 'run-20260804-122732-610');
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      // Older run becomes baseline, newer becomes comparison.
      expect(result.baselineRunId).toBe('run-20260804-122732-610');
      expect(result.comparisonRunId).toBe('run-20260804-132457-920');
    }
  });
});

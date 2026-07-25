import { test, expect } from '@playwright/test';
import {
  decisionHintFor,
  decisionHintTooltipFor,
  decisionHintBlurbFor,
  normalizeFailureSource,
  resolveFailureSource,
  suggestFailureSource,
} from '../../support/custom-dashboard/failure-source';

test.describe('failure-source helpers', () => {
  test('normalizeFailureSource accepts aliases and rejects junk', () => {
    expect(normalizeFailureSource('APP')).toBe('app');
    expect(normalizeFailureSource('ai-generation')).toBe('ai_generation');
    expect(normalizeFailureSource('bug')).toBe('app');
    expect(normalizeFailureSource('selector')).toBe('test');
    expect(normalizeFailureSource('not-a-source')).toBeUndefined();
  });

  test('suggestFailureSource classifies common error patterns', () => {
    expect(
      suggestFailureSource({
        status: 'failed',
        errorMessage: 'TimeoutError: locator.click: Timeout 10000ms exceeded',
      }),
    ).toBe('test');
    expect(
      suggestFailureSource({
        status: 'failed',
        errorMessage: 'connect ECONNREFUSED 127.0.0.1:3000',
      }),
    ).toBe('env');
    expect(
      suggestFailureSource({
        status: 'failed',
        errorMessage: 'HTTP status 500 Internal Server Error',
      }),
    ).toBe('app');
    expect(suggestFailureSource({ status: 'passed', errorMessage: 'anything' })).toBeUndefined();
  });

  test('resolveFailureSource prefers annotation over heuristic', () => {
    expect(
      resolveFailureSource({
        status: 'failed',
        errorMessage: 'locator.click timeout',
        annotation: 'env',
      }),
    ).toBe('env');
    expect(
      resolveFailureSource({
        status: 'failed',
        errorMessage: 'locator.click timeout',
      }),
    ).toBe('test');
  });

  test('decisionHintFor maps to QA exit labels', () => {
    expect(decisionHintFor('app')).toBe('FILE BUG');
    expect(decisionHintFor('test')).toBe('FIX TEST');
    expect(decisionHintFor('ai_generation')).toBe('FIX TEST/GENERATOR');
    expect(decisionHintFor('requirement')).toBe('REVISE REQUIREMENT');
    expect(decisionHintFor('env')).toBe('FIX ENVIRONMENT');
    expect(decisionHintFor('unknown')).toBe('TRIAGE');
  });

  test('decisionHintTooltipFor explains each source for QA hover', () => {
    expect(decisionHintTooltipFor('app')).toMatch(/defect|bug/i);
    expect(decisionHintTooltipFor('test')).toMatch(/selector|test/i);
    expect(decisionHintTooltipFor('ai_generation')).toMatch(/generator|AI/i);
    expect(decisionHintTooltipFor('requirement')).toMatch(/requirement/i);
    expect(decisionHintTooltipFor('env')).toMatch(/environment|auth|env/i);
    expect(decisionHintTooltipFor('unknown')).toMatch(/triage|jelas|investigasi/i);
    expect(decisionHintTooltipFor(undefined)).toMatch(/triage|jelas|investigasi/i);
  });

  test('decisionHintBlurbFor is short visible copy', () => {
    expect(decisionHintBlurbFor('app').length).toBeLessThan(48);
    expect(decisionHintBlurbFor('test')).toMatch(/selector|test/i);
    expect(decisionHintBlurbFor('env')).toMatch(/auth|env|seed/i);
    expect(decisionHintBlurbFor(undefined)).toMatch(/investigasi/i);
  });
});

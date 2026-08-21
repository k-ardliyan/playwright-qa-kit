import { test, expect } from '@playwright/test';
import { inferFailureSource } from '../../../tools/mcp/src/tools/get-test-failures';
import { classifyFailureFromEvidence } from '../../shared/evidence/failure-classifier';
import {
  containsEphemeralRef,
  EPHEMERAL_REF_PATTERNS,
} from '../../../tools/mcp/src/utils/ephemeral-guard';

test.describe('Failure Classifier Integration & Root-Cause Triage (Phase 8)', () => {
  test('inferFailureSource classifies 5xx server errors as app defect', () => {
    expect(inferFailureSource('Server returned status 500 Internal Server Error')).toBe('app');
    expect(inferFailureSource('503 Service Unavailable on POST /api/login')).toBe('app');
  });

  test('inferFailureSource classifies session/auth errors as env defect', () => {
    expect(inferFailureSource('storageState missing or expired, unauthorized 401')).toBe('env');
    expect(inferFailureSource('User is redirected to login page due to expired credentials')).toBe(
      'env',
    );
  });

  test('inferFailureSource classifies syntax/ephemeral ref errors as ai_generation defect', () => {
    expect(inferFailureSource('SyntaxError: Unexpected token < in JSON at position 0')).toBe(
      'ai_generation',
    );
    expect(inferFailureSource('Element handle not found for ephemeral ref:tw-8f2a')).toBe(
      'ai_generation',
    );
  });

  // GAP 2: requirement class now supported
  test('inferFailureSource classifies business rule assertion failures as requirement defect', () => {
    expect(inferFailureSource('assertion failed expected 3 items but got 5')).toBe('requirement');
    expect(inferFailureSource('no such step found in current workflow')).toBe('requirement');
    expect(inferFailureSource('missing mandatory field: invoiceDate')).toBe('requirement');
    expect(inferFailureSource('business rule: discount not applicable for this role')).toBe(
      'requirement',
    );
  });

  test('inferFailureSource classifies locator timeout as test defect', () => {
    expect(
      inferFailureSource('Locator timeout 5000ms exceeded waiting for locator("button.submit")'),
    ).toBe('test');
  });

  // GAP 1: shared ephemeral-guard util correctness
  test('containsEphemeralRef detects all ephemeral reference patterns', () => {
    expect(containsEphemeralRef('click on ref:abc123')).toBe(true);
    expect(containsEphemeralRef('fill handle:xyz-99 with value')).toBe(true);
    expect(containsEphemeralRef('locator tw-8f2a is stale')).toBe(true);
    expect(containsEphemeralRef('playwright-element-42 not found')).toBe(true);
    expect(containsEphemeralRef('click on button[data-testid="submit"]')).toBe(false);
  });

  test('EPHEMERAL_REF_PATTERNS is exported and non-empty (single source of truth)', () => {
    expect(Array.isArray(EPHEMERAL_REF_PATTERNS)).toBe(true);
    expect(EPHEMERAL_REF_PATTERNS.length).toBeGreaterThan(0);
  });

  test('classifyFailureFromEvidence returns structured result with healability flag', () => {
    const appDefect = classifyFailureFromEvidence('Internal Server Error 500');
    expect(appDefect.category).toBe('application');
    expect(appDefect.isHealable).toBe(false);
    expect(appDefect.recommendedAction).toContain('FILE BUG');

    const authDefect = classifyFailureFromEvidence('401 Unauthorized');
    expect(authDefect.category).toBe('auth');
    expect(authDefect.isHealable).toBe(false);
    expect(authDefect.recommendedAction).toContain('FIX ENVIRONMENT');

    const locatorDefect = classifyFailureFromEvidence('locator.click: Timeout 5000ms exceeded');
    expect(locatorDefect.category).toBe('locator');
    expect(locatorDefect.isHealable).toBe(true);
  });
});

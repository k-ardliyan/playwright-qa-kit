/**
 * Unit tests for protocol edge cases — Agent AI Integration Layer
 *
 * Validates: Requirements 1.3, 1.7
 */

import { test, expect } from '@playwright/test';
import {
  validateRequest,
  createSuccessResponse,
  createErrorResponse,
  createInProgressResponse,
  VALID_PHASES,
} from '../protocol';

test.describe('Protocol Validation — Capability Query (Req 1.3)', () => {
  test('capability query action validates without error', () => {
    const result = validateRequest({ action: 'query' });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.request.action).toBe('query');
      expect(result.request.options?.orchestrationMode).toBe('manual');
    }
  });
});

test.describe('Protocol Validation — Default Orchestration Mode (Req 1.7)', () => {
  test('default orchestration mode is "manual" when omitted', () => {
    const result = validateRequest({
      action: 'invoke',
      phase: 'plan',
      requirementPath: 'requirements/test.md',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.request.options?.orchestrationMode).toBe('manual');
    }
  });

  test('explicit orchestration mode is preserved', () => {
    const result = validateRequest({
      action: 'invoke',
      phase: 'plan',
      requirementPath: 'requirements/test.md',
      options: { orchestrationMode: 'automatic' },
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.request.options?.orchestrationMode).toBe('automatic');
    }
  });
});

test.describe('Protocol Validation — Invalid Phase Values', () => {
  test('invalid phase values return descriptive errors', () => {
    const result = validateRequest({
      action: 'invoke',
      phase: 'invalid-phase',
      requirementPath: 'requirements/test.md',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe('error');
      const errors = result.error.errors!;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('INVALID_PHASE');
      // Error message should contain all valid phase names
      for (const phase of VALID_PHASES) {
        expect(errors[0].message).toContain(phase);
      }
    }
  });
});

test.describe('Protocol Validation — Schema Violations', () => {
  test('invoke without phase returns schema violation', () => {
    const result = validateRequest({
      action: 'invoke',
      requirementPath: 'requirements/test.md',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe('error');
      const errors = result.error.errors!;
      expect(errors.some((e) => e.message.toLowerCase().includes('phase'))).toBe(true);
    }
  });

  test('invoke without requirementPath returns schema violation', () => {
    const result = validateRequest({
      action: 'invoke',
      phase: 'plan',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe('error');
      const errors = result.error.errors!;
      expect(errors.some((e) => e.message.toLowerCase().includes('requirementpath'))).toBe(true);
    }
  });

  test('resume without options.runId returns schema violation', () => {
    const result = validateRequest({ action: 'resume' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe('error');
      const errors = result.error.errors!;
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  test('resume with valid runId validates', () => {
    const result = validateRequest({
      action: 'resume',
      options: { runId: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.request.action).toBe('resume');
      expect(result.request.options?.runId).toBe('550e8400-e29b-41d4-a716-446655440000');
    }
  });

  test('null request returns schema violation', () => {
    const result = validateRequest(null);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe('error');
      const errors = result.error.errors!;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('SCHEMA_VIOLATION');
    }
  });
});

test.describe('Protocol Response Helpers', () => {
  test('response helpers produce correct structure', () => {
    const successResponse = createSuccessResponse('plan');
    expect(successResponse.status).toBe('success');
    expect(successResponse.phase).toBe('plan');

    const errorResponse = createErrorResponse([
      { code: 'TEST_ERROR', message: 'Something went wrong', retryable: false },
    ]);
    expect(errorResponse.status).toBe('error');
    expect(errorResponse.errors).toHaveLength(1);
    expect(errorResponse.errors![0].code).toBe('TEST_ERROR');

    const inProgressResponse = createInProgressResponse('generate');
    expect(inProgressResponse.status).toBe('in-progress');
    expect(inProgressResponse.phase).toBe('generate');
  });
});

import { test, expect } from '@playwright/test';
import { LiveVerificationGate } from '../../agents/generator/live-verification-gate';
import { adaptOfficialGeneratedLocator } from '../../shared/mcp/locator-generator-adapter';
import { recordSemanticObservation } from '../../shared/mcp/semantic-verifier';

test.describe('Generator Integration: Ordinary Semantic Form (MCP-043)', () => {
  test('evaluates live verification and resolves semantic locators', () => {
    const candidate1 = adaptOfficialGeneratedLocator({
      locator: "page.getByRole('button', { name: 'Submit' })",
      role: 'button',
      name: 'Submit',
      confidence: 0.95,
    });

    const candidate2 = adaptOfficialGeneratedLocator({
      locator: "page.getByLabel('Email Address')",
      label: 'Email Address',
      confidence: 0.9,
    });

    const observation = recordSemanticObservation({
      category: 'element',
      target: 'Submit button',
      expected: true,
      actual: true,
      passed: true,
      message: 'Submit button is visible and active',
    });

    const result = LiveVerificationGate.evaluate({
      scenarioId: 'FORM-001',
      intent: { requires: { storage: true } },
      discoveredCandidates: [candidate1, candidate2],
      observations: [observation],
    });

    expect(result.verified).toBe(true);
    expect(result.warnings.length).toBe(0);
    expect(result.locatorCandidates.length).toBe(2);
    expect(result.locatorCandidates[0].strategy).toBe('role');
    expect(result.locatorCandidates[1].strategy).toBe('label');
  });

  test('marks verification failed when a semantic observation does not pass', () => {
    const failedObservation = recordSemanticObservation({
      category: 'text',
      target: 'Success message',
      expected: true,
      actual: false,
      passed: false,
      message: 'Expected success message but it was not visible',
    });

    const result = LiveVerificationGate.evaluate({
      scenarioId: 'FORM-002',
      intent: { requires: { storage: true } },
      discoveredCandidates: [],
      observations: [failedObservation],
    });

    expect(result.verified).toBe(false);
    expect(result.warnings.some((w) => w.includes('failed during live verification'))).toBe(true);
  });
});

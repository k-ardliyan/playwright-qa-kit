import type { VerificationObservation } from '../types/live-verification.types';

export interface SemanticAssertionInput {
  category: 'element' | 'text' | 'value' | 'list' | 'network' | 'url';
  target: string;
  expected: string | number | boolean;
  actual?: string | number | boolean;
  passed: boolean;
  message?: string;
}

/**
 * Record a clean, semantic verification observation without leaking raw element refs.
 */
export function recordSemanticObservation(input: SemanticAssertionInput): VerificationObservation {
  return {
    category: input.category,
    target: sanitizeTargetString(input.target),
    expected: input.expected,
    actual: input.actual,
    passed: input.passed,
    message: input.message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Strips raw ephemeral MCP ref tokens (e.g. ref:tw-123 or node_id=987) from target strings.
 */
export function sanitizeTargetString(target: string): string {
  return target
    .replace(/ref:[a-zA-Z0-9_-]+/g, '[element]')
    .replace(/node_id=\d+/g, '')
    .trim();
}

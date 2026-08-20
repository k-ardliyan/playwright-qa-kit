import type { LocatorCandidate } from './locator-candidate.types';

export interface VerificationObservation {
  category: 'element' | 'text' | 'value' | 'list' | 'network' | 'url';
  target: string;
  expected: string | number | boolean;
  actual?: string | number | boolean;
  passed: boolean;
  message?: string;
  timestamp: string;
}

export interface LiveVerificationResult {
  scenarioId: string;
  verified: boolean;
  url?: string;
  observations: VerificationObservation[];
  locatorCandidates: LocatorCandidate[];
  warnings: string[];
}

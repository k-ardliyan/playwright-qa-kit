import type { LocatorCandidate, LocatorStrategy } from '../types/locator-candidate.types';

export interface OfficialGeneratedLocatorOutput {
  locator: string;
  role?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  testId?: string;
  text?: string;
  confidence?: number;
}

/**
 * Adapt output from official Playwright MCP `browser_generate_locator` into a normalized LocatorCandidate.
 */
export function adaptOfficialGeneratedLocator(
  raw: OfficialGeneratedLocatorOutput | string,
): LocatorCandidate {
  if (typeof raw === 'string') {
    return inferLocatorCandidateFromString(raw);
  }

  const selector = raw.locator || '';
  let strategy: LocatorStrategy = 'css';

  if (raw.role || selector.startsWith('getByRole(')) {
    strategy = 'role';
  } else if (raw.label || selector.startsWith('getByLabel(')) {
    strategy = 'label';
  } else if (raw.placeholder || selector.startsWith('getByPlaceholder(')) {
    strategy = 'placeholder';
  } else if (raw.testId || selector.startsWith('getByTestId(')) {
    strategy = 'testid';
  } else if (raw.text || selector.startsWith('getByText(')) {
    strategy = 'text';
  }

  return {
    strategy,
    selector,
    role: raw.role,
    name: raw.name,
    label: raw.label,
    placeholder: raw.placeholder,
    testId: raw.testId,
    text: raw.text,
    source: 'official-generated',
    confidence: raw.confidence ?? 0.85,
    verifiedAt: new Date().toISOString(),
  };
}

function inferLocatorCandidateFromString(selector: string): LocatorCandidate {
  let strategy: LocatorStrategy = 'css';
  if (selector.includes('getByRole')) strategy = 'role';
  else if (selector.includes('getByLabel')) strategy = 'label';
  else if (selector.includes('getByPlaceholder')) strategy = 'placeholder';
  else if (selector.includes('getByTestId')) strategy = 'testid';
  else if (selector.includes('getByText')) strategy = 'text';

  return {
    strategy,
    selector,
    source: 'official-generated',
    confidence: 0.8,
    verifiedAt: new Date().toISOString(),
  };
}

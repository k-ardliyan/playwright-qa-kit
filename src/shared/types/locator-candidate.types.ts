export type LocatorStrategy =
  | 'pom'
  | 'catalog'
  | 'role'
  | 'label'
  | 'placeholder'
  | 'testid'
  | 'text'
  | 'css'
  | 'xpath'
  | 'coords';

export interface LocatorCandidate {
  strategy: LocatorStrategy;
  selector: string;
  role?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  testId?: string;
  text?: string;
  source: 'pom' | 'catalog' | 'official-generated' | 'fallback' | 'vision';
  confidence: number; // 0.0 to 1.0
  verifiedAt?: string;
}

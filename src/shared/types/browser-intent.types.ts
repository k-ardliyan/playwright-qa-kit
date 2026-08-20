/**
 * Normalized schema representing browser interaction needs for a scenario or test plan.
 */

export interface BrowserRequirements {
  network?: boolean;
  storage?: boolean;
  vision?: boolean;
  pdf?: boolean;
  devtools?: boolean;
  multiTab?: boolean;
  dialog?: boolean;
  fileUpload?: boolean;
}

export interface BrowserIntent {
  requires?: BrowserRequirements;
  viewport?: { width: number; height: number };
  mode?: 'semantic' | 'visual' | 'offline';
}

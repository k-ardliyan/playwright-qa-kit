import type { BrowserIntent, BrowserRequirements } from '../types/browser-intent.types';

export interface IntentValidationResult {
  valid: boolean;
  intent: BrowserIntent;
  errors: string[];
  warnings: string[];
}

const KNOWN_REQUIREMENTS_KEYS: (keyof BrowserRequirements)[] = [
  'network',
  'storage',
  'vision',
  'pdf',
  'devtools',
  'multiTab',
  'dialog',
  'fileUpload',
];

/**
 * Validate and normalize a raw BrowserIntent object.
 */
export function validateBrowserIntent(raw: unknown): IntentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      intent: {},
      errors: ['Browser intent must be an object'],
      warnings: [],
    };
  }

  const rawObj = raw as Record<string, unknown>;
  const normalizedReqs: BrowserRequirements = {};

  if (rawObj.requires !== undefined) {
    if (
      typeof rawObj.requires !== 'object' ||
      rawObj.requires === null ||
      Array.isArray(rawObj.requires)
    ) {
      errors.push('requires field must be an object');
    } else {
      const reqObj = rawObj.requires as Record<string, unknown>;
      for (const [k, v] of Object.entries(reqObj)) {
        if (!KNOWN_REQUIREMENTS_KEYS.includes(k as keyof BrowserRequirements)) {
          warnings.push(`Unknown browser requirement key: '${k}'`);
        } else if (typeof v === 'boolean') {
          normalizedReqs[k as keyof BrowserRequirements] = v;
        } else if (typeof v === 'string') {
          normalizedReqs[k as keyof BrowserRequirements] = v.trim().toLowerCase() === 'true';
        }
      }
    }
  }

  let normalizedViewport: { width: number; height: number } | undefined;
  if (rawObj.viewport !== undefined) {
    if (
      typeof rawObj.viewport === 'object' &&
      rawObj.viewport !== null &&
      !Array.isArray(rawObj.viewport)
    ) {
      const vp = rawObj.viewport as Record<string, unknown>;
      const w = Number(vp.width);
      const h = Number(vp.height);
      if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) {
        normalizedViewport = { width: w, height: h };
      } else {
        warnings.push('Invalid viewport dimensions; width and height must be positive numbers');
      }
    } else {
      warnings.push('Viewport must be an object with width and height');
    }
  }

  let normalizedMode: 'semantic' | 'visual' | 'offline' | undefined;
  if (typeof rawObj.mode === 'string') {
    const m = rawObj.mode.trim().toLowerCase();
    if (m === 'semantic' || m === 'visual' || m === 'offline') {
      normalizedMode = m;
    } else {
      warnings.push(`Unknown mode '${rawObj.mode}', defaulting to 'semantic'`);
    }
  }

  const normalizedIntent: BrowserIntent = {
    requires: normalizedReqs,
    ...(normalizedViewport ? { viewport: normalizedViewport } : {}),
    ...(normalizedMode ? { mode: normalizedMode } : {}),
  };

  return {
    valid: errors.length === 0,
    intent: normalizedIntent,
    errors,
    warnings,
  };
}

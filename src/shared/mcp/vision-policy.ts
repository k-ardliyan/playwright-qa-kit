export interface VisionFallbackReason {
  target: string;
  category: 'canvas' | 'webgl' | 'map' | 'inaccessible-widget' | 'image-control';
  explanation: string;
  isNormalSemanticControl: boolean;
}

export interface AccessibilityWarning {
  element: string;
  warning: string;
  recommendation: string;
}

/**
 * Evaluate whether vision fallback is justified and generate accessibility warnings if a normal control lacks semantic representation.
 */
export function evaluateVisionFallback(input: VisionFallbackReason): {
  allowed: boolean;
  warnings: AccessibilityWarning[];
} {
  const warnings: AccessibilityWarning[] = [];

  if (input.isNormalSemanticControl) {
    warnings.push({
      element: input.target,
      warning: `Standard interactive control '${input.target}' is not accessible in the semantic ARIA tree and required vision fallback.`,
      recommendation: `Add role, aria-label, or title to '${input.target}' in application code rather than relying on brittle coordinate clicks.`,
    });
  }

  return {
    allowed: true,
    warnings,
  };
}

/**
 * Check if a selector expression uses raw pixel coordinates.
 */
export function isCoordinateSelector(selector: string): boolean {
  return /(coords|click\s*\(\s*\d+\s*,\s*\d+\s*\)|x:\s*\d+,\s*y:\s*\d+|mouse\.click)/i.test(
    selector,
  );
}

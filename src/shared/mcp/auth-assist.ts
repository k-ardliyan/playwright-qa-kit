import { normalizeOrigin } from './origin-resolver';

export interface AuthAssistConfig {
  mode: 'interactive-headed' | 'cdp-connect';
  environment: string;
  role: string;
  expectedOrigin: string;
  cdpEndpoint?: string;
  localOnly: boolean;
}

export interface AuthAssistValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate configuration for interactive auth assist mode.
 */
export function validateAuthAssistConfig(config: AuthAssistConfig): AuthAssistValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.role || config.role.trim().length === 0) {
    errors.push('Role is required for auth-assist mode');
  }

  if (!config.expectedOrigin || !normalizeOrigin(config.expectedOrigin)) {
    errors.push(`Invalid or missing expectedOrigin: '${config.expectedOrigin}'`);
  }

  if (config.mode === 'cdp-connect') {
    if (!config.cdpEndpoint || config.cdpEndpoint.trim().length === 0) {
      errors.push('CDP endpoint (e.g. http://localhost:9222) is required for cdp-connect mode');
    } else if (
      !config.cdpEndpoint.startsWith('http://localhost') &&
      !config.cdpEndpoint.startsWith('http://127.0.0.1')
    ) {
      warnings.push('CDP endpoint is not on localhost; ensure remote debugging port is secured');
    }
  }

  if (process.env.CI && config.mode === 'interactive-headed') {
    errors.push('Interactive headed auth-assist mode cannot run under CI');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

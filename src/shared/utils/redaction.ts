const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /cookie/i,
  /set-cookie/i,
  /access_token/i,
  /refresh_token/i,
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /otp/i,
  /bearer/i,
  /csrf/i,
];

const BEARER_REGEX = /(?:Bearer|Basic)\s+([A-Za-z0-9_\-./+=]+)/gi;

/**
 * Check whether a key name represents a sensitive credential or secret.
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redact sensitive headers, object properties, or raw strings.
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    // If the string is JSON (e.g. a network bodyExcerpt), redact its parsed
    // structure so secrets reach persisted artifacts fully sanitized.
    if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(input) as unknown;
        if (parsed !== null && typeof parsed === 'object') {
          return JSON.stringify(redactSensitiveData(parsed)) as unknown as T;
        }
      } catch {
        // Not valid JSON — fall through to string handling.
      }
    }

    let sanitized = input.replace(BEARER_REGEX, (m) => {
      const scheme = m.trim().split(/\s+/)[0];
      return `${scheme} [REDACTED]`;
    });
    // Also redact password=... token=... otp=... etc in query strings
    sanitized = sanitized.replace(
      /(password|passwd|token|secret|apikey|access_token|refresh_token|otp|authorization|csrf)=([^&\s]+)/gi,
      '$1=[REDACTED]',
    );
    // Redact entire Cookie / Set-Cookie header values.
    sanitized = sanitized.replace(
      /(?:Cookie|Set-Cookie):\s*[^\r\n]*/gi,
      (m) => `${m.split(/:\s*/)[0]}: [REDACTED]`,
    );
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (isSensitiveKey(key)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          result[key] = '[REDACTED]';
        } else if (value && typeof value === 'object') {
          result[key] = redactSensitiveData(value);
        } else {
          result[key] = '[REDACTED]';
        }
      } else {
        result[key] = redactSensitiveData(value);
      }
    }
    return result as unknown as T;
  }

  return input;
}

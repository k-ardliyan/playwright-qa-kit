import * as fs from 'node:fs';

export interface AuthStateProbeResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'missing' | 'malformed';
  reason?: string;
  cookiesCount: number;
  expiredCookiesCount: number;
  originsCount: number;
}

interface StorageStatePayload {
  cookies?: Array<{
    name: string;
    expires?: number;
    value?: string;
  }>;
  origins?: Array<{
    origin: string;
    localStorage?: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Probe a storage state JSON file for structural validity and cookie expiration.
 */
export function probeAuthStateFile(filePath: string): AuthStateProbeResult {
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      status: 'missing',
      reason: `Auth state file does not exist at ${filePath}`,
      cookiesCount: 0,
      expiredCookiesCount: 0,
      originsCount: 0,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as StorageStatePayload;

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        status: 'malformed',
        reason: 'Storage state is not a valid JSON object',
        cookiesCount: 0,
        expiredCookiesCount: 0,
        originsCount: 0,
      };
    }

    const cookies = Array.isArray(parsed.cookies) ? parsed.cookies : [];
    const origins = Array.isArray(parsed.origins) ? parsed.origins : [];

    const nowSeconds = Math.floor(Date.now() / 1000);
    let expiredCount = 0;

    for (const cookie of cookies) {
      if (cookie.expires && cookie.expires > 0 && cookie.expires < nowSeconds) {
        expiredCount++;
      }
    }

    if (cookies.length === 0 && origins.length === 0) {
      return {
        valid: false,
        status: 'malformed',
        reason: 'Storage state contains neither cookies nor origin storage',
        cookiesCount: 0,
        expiredCookiesCount: 0,
        originsCount: 0,
      };
    }

    if (expiredCount > 0 && expiredCount === cookies.length) {
      return {
        valid: false,
        status: 'expired',
        reason: `All ${cookies.length} session cookies are expired`,
        cookiesCount: cookies.length,
        expiredCookiesCount: expiredCount,
        originsCount: origins.length,
      };
    }

    return {
      valid: true,
      status: 'valid',
      cookiesCount: cookies.length,
      expiredCookiesCount: expiredCount,
      originsCount: origins.length,
    };
  } catch (err) {
    return {
      valid: false,
      status: 'malformed',
      reason: `Failed to parse storage state JSON: ${err instanceof Error ? err.message : String(err)}`,
      cookiesCount: 0,
      expiredCookiesCount: 0,
      originsCount: 0,
    };
  }
}

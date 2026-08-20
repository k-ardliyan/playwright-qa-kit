import { URL } from 'node:url';

export interface ResolveOriginsOptions {
  baseUrl?: string;
  apiBaseUrl?: string;
  extraOrigins?: string[];
}

/**
 * Normalize an arbitrary URL string to its canonical origin (e.g. "https://example.com:8080").
 * Returns null if the URL is malformed.
 */
export function normalizeOrigin(rawUrl: string): string | null {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed === '*') return null;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return null;
    }
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith('http')) return null;
    if (!parsed.hostname || parsed.hostname.length === 0) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve allowed origins from environment configuration and optional extra origins.
 */
export function resolveAllowedOrigins(options: ResolveOriginsOptions = {}): string[] {
  const rawList: (string | undefined)[] = [
    options.baseUrl ?? process.env.BASE_URL ?? process.env.APP_BASE_URL,
    options.apiBaseUrl ?? process.env.API_BASE_URL,
    ...(options.extraOrigins ?? []),
  ];

  const originsSet = new Set<string>();

  for (const item of rawList) {
    if (!item) continue;
    const normalized = normalizeOrigin(item);
    if (normalized) {
      originsSet.add(normalized);
    }
  }

  // If no origin resolved, fallback to localhost:3000 as safe default
  if (originsSet.size === 0) {
    originsSet.add('http://localhost:3000');
  }

  return Array.from(originsSet);
}

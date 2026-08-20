export interface NormalizedNetworkEvidence {
  method: string;
  url: string;
  status: number;
  durationMs?: number;
  safeHeaders?: Record<string, string>;
  bodyExcerpt?: string;
  timestamp: string;
  failureWindow?: boolean;
}

export interface PageSemanticSnapshot {
  environment: string;
  url: string;
  headings: string[];
  actionButtons: string[];
  consoleErrors: string[];
  statusCode?: number;
}

export interface SemanticDiffResult {
  url: string;
  hasDifferences: boolean;
  missingHeadings: { inEnv1Only: string[]; inEnv2Only: string[] };
  missingActions: { inEnv1Only: string[]; inEnv2Only: string[] };
  consoleErrorDiff: { env1Errors: string[]; env2Errors: string[] };
  statusDiff?: { env1Status?: number; env2Status?: number };
}

/**
 * Compute semantic diff between two isolated environment snapshots.
 */
export function computeSemanticEnvironmentDiff(
  env1: PageSemanticSnapshot,
  env2: PageSemanticSnapshot,
): SemanticDiffResult {
  const setH1 = new Set(env1.headings);
  const setH2 = new Set(env2.headings);
  const h1Only = env1.headings.filter((h) => !setH2.has(h));
  const h2Only = env2.headings.filter((h) => !setH1.has(h));

  const setA1 = new Set(env1.actionButtons);
  const setA2 = new Set(env2.actionButtons);
  const a1Only = env1.actionButtons.filter((a) => !setA2.has(a));
  const a2Only = env2.actionButtons.filter((a) => !setA1.has(a));

  const hasDifferences =
    h1Only.length > 0 ||
    h2Only.length > 0 ||
    a1Only.length > 0 ||
    a2Only.length > 0 ||
    env1.statusCode !== env2.statusCode;

  return {
    url: env1.url,
    hasDifferences,
    missingHeadings: { inEnv1Only: h1Only, inEnv2Only: h2Only },
    missingActions: { inEnv1Only: a1Only, inEnv2Only: a2Only },
    consoleErrorDiff: { env1Errors: env1.consoleErrors, env2Errors: env2.consoleErrors },
    statusDiff: { env1Status: env1.statusCode, env2Status: env2.statusCode },
  };
}

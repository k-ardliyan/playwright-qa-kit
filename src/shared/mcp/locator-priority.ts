import type { LocatorCandidate, LocatorStrategy } from '../types/locator-candidate.types';

const STRATEGY_BASE_WEIGHTS: Record<LocatorStrategy, number> = {
  pom: 100,
  catalog: 80,
  role: 70,
  label: 65,
  placeholder: 60,
  testid: 55,
  text: 50,
  css: 30,
  xpath: 20,
  coords: 10,
};

export interface ResolvedLocatorPriority {
  best: LocatorCandidate | null;
  ranking: LocatorCandidate[];
  reason: string;
}

/**
 * Rank locator candidates based on stability, semantic accessibility, and provenance.
 */
export function resolveLocatorPriority(candidates: LocatorCandidate[]): ResolvedLocatorPriority {
  if (!candidates || candidates.length === 0) {
    return {
      best: null,
      ranking: [],
      reason: 'No locator candidates provided',
    };
  }

  const scored = candidates.map((candidate) => {
    const baseWeight = STRATEGY_BASE_WEIGHTS[candidate.strategy] ?? 20;
    const confidenceMultiplier = candidate.confidence ?? 1.0;
    const score = baseWeight * confidenceMultiplier;
    return { candidate, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const ranking = scored.map((s) => s.candidate);
  const best = ranking[0];

  let reason = `Selected ${best.strategy} locator (${best.source}) with score ${scored[0].score.toFixed(1)}`;
  if (best.strategy === 'pom') {
    reason = 'Prioritized existing POM convention for maximum consistency';
  } else if (best.strategy === 'catalog') {
    reason = 'Prioritized verified selector catalog entry';
  } else if (['role', 'label', 'placeholder', 'testid', 'text'].includes(best.strategy)) {
    reason = `Prioritized semantic ${best.strategy} locator generated from live browser state`;
  } else if (best.strategy === 'coords') {
    reason =
      'Warning: using coordinate-based visual fallback because no semantic locator was found';
  }

  return {
    best,
    ranking,
    reason,
  };
}

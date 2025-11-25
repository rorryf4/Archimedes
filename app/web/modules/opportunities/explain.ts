/**
 * Explainability v1 for Opportunity Scores (Milestone 32)
 *
 * Builds deterministic explanations based on sub-scores, weights, and verdicts.
 */

import type { Opportunity, OpportunitySubScores } from './service';

export interface OpportunityExplanationFactor {
  key: 'severity' | 'density' | 'momentum' | 'volume' | 'trend' | 'preferences';
  label: string;
  score: number; // 0–100 sub-score
  weight: number; // 0–1 weight from scoring model
  contribution: number; // normalized contribution on a 0–100 basis
  verdict: 'strong' | 'neutral' | 'weak';
}

export interface OpportunityExplanation {
  headline: string;
  factors: OpportunityExplanationFactor[];
}

/**
 * Fixed weights for sub-scores (must sum to 1.0)
 */
const WEIGHTS = {
  severity: 0.3,
  density: 0.2,
  momentum: 0.15,
  volume: 0.15,
  trend: 0.1,
  preferences: 0.1,
} as const;

/**
 * Determine verdict based on score
 */
function getVerdict(score: number): 'strong' | 'neutral' | 'weak' {
  if (score >= 75) return 'strong';
  if (score >= 40) return 'neutral';
  return 'weak';
}

/**
 * Build factors array from sub-scores
 */
function buildFactors(subScores: OpportunitySubScores): OpportunityExplanationFactor[] {
  const factors: OpportunityExplanationFactor[] = [
    {
      key: 'severity',
      label: 'Signal Severity',
      score: subScores.severity,
      weight: WEIGHTS.severity,
      contribution: (subScores.severity / 100) * (WEIGHTS.severity * 100),
      verdict: getVerdict(subScores.severity),
    },
    {
      key: 'density',
      label: 'Signal Density',
      score: subScores.signalDensity,
      weight: WEIGHTS.density,
      contribution: (subScores.signalDensity / 100) * (WEIGHTS.density * 100),
      verdict: getVerdict(subScores.signalDensity),
    },
    {
      key: 'momentum',
      label: 'Price Momentum',
      score: subScores.priceMomentum,
      weight: WEIGHTS.momentum,
      contribution: (subScores.priceMomentum / 100) * (WEIGHTS.momentum * 100),
      verdict: getVerdict(subScores.priceMomentum),
    },
    {
      key: 'volume',
      label: 'Volume',
      score: subScores.volume,
      weight: WEIGHTS.volume,
      contribution: (subScores.volume / 100) * (WEIGHTS.volume * 100),
      verdict: getVerdict(subScores.volume),
    },
    {
      key: 'trend',
      label: 'Trend',
      score: subScores.trend,
      weight: WEIGHTS.trend,
      contribution: (subScores.trend / 100) * (WEIGHTS.trend * 100),
      verdict: getVerdict(subScores.trend),
    },
    {
      key: 'preferences',
      label: 'Preference Alignment',
      score: subScores.preferenceAlignment,
      weight: WEIGHTS.preferences,
      contribution: (subScores.preferenceAlignment / 100) * (WEIGHTS.preferences * 100),
      verdict: getVerdict(subScores.preferenceAlignment),
    },
  ];

  // Sort by contribution descending
  return factors.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Generate headline based on factor verdicts
 */
function generateHeadline(factors: OpportunityExplanationFactor[]): string {
  // Find factors by key for easier access
  const factorMap = new Map(factors.map((f) => [f.key, f]));

  const severity = factorMap.get('severity')!;
  const density = factorMap.get('density')!;
  const momentum = factorMap.get('momentum')!;
  const volume = factorMap.get('volume')!;
  const trend = factorMap.get('trend')!;
  const preferences = factorMap.get('preferences')!;

  // Count strong factors
  const strongFactors = factors.filter((f) => f.verdict === 'strong');
  const weakFactors = factors.filter((f) => f.verdict === 'weak');

  // Rule 1: All weak
  if (weakFactors.length >= 5) {
    return 'Weak signals and market conditions suggest low conviction opportunity.';
  }

  // Rule 2: Strong severity + strong density
  if (severity.verdict === 'strong' && density.verdict === 'strong') {
    return 'High-severity signals with strong confluence create compelling opportunity.';
  }

  // Rule 3: Strong severity but neutral/weak density
  if (severity.verdict === 'strong' && density.verdict !== 'strong') {
    return 'High-severity signal present but limited confluence with other indicators.';
  }

  // Rule 4: Strong momentum + strong volume
  if (momentum.verdict === 'strong' && volume.verdict === 'strong') {
    return 'Strong price momentum backed by elevated volume suggests sustained move.';
  }

  // Rule 5: Strong trend but neutral/weak severity
  if (trend.verdict === 'strong' && severity.verdict !== 'strong') {
    return 'Favorable trend pattern with moderate signal strength.';
  }

  // Rule 6: Strong preferences
  if (preferences.verdict === 'strong') {
    return 'Strong alignment with your signal preferences highlights relevance.';
  }

  // Rule 7: Multiple strong factors (3+)
  if (strongFactors.length >= 3) {
    return 'Multiple strong factors align to create solid opportunity.';
  }

  // Rule 8: Mixed signals
  if (strongFactors.length >= 1 && weakFactors.length >= 2) {
    return 'Mixed signals with some strength but notable weaknesses.';
  }

  // Default: Neutral
  return 'Moderate signals and market conditions suggest neutral setup.';
}

/**
 * Build complete explanation for an opportunity
 */
export function buildOpportunityExplanation(
  subScores: OpportunitySubScores
): OpportunityExplanation {
  const factors = buildFactors(subScores);
  const headline = generateHeadline(factors);

  return {
    headline,
    factors,
  };
}

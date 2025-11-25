import { listWatchlistsEnriched } from '../watchlists/service';
import type { WatchlistItemEnriched } from '../watchlists/types';
import type { SignalResult, SignalSeverity } from '../signals/types';
import {
  getPrimarySignal,
  getSeverityRank,
  countSignalsBySeverity,
  hasSignalAtOrAbove,
} from '../signals/catalog';
import { getCurrentUserSignalPreferences } from '../signals/preferences.service';
import { getPriceHistoryForAsset } from '../markets/history';
import { buildOpportunityExplanation, type OpportunityExplanation } from './explain';
import { getCandlestickData } from '../markets/candles';
import { detectStructureSignals } from './structure';
import { analyzeIndicators, type IndicatorSignals } from './indicators';

/**
 * Sub-scores that contribute to the final opportunity score
 */
export interface OpportunitySubScores {
  severity: number; // 0-100
  signalDensity: number; // 0-100
  priceMomentum: number; // 0-100
  volume: number; // 0-100
  trend: number; // 0-100
  preferenceAlignment: number; // 0-100
}

export interface Opportunity {
  id: string;
  symbol: string;
  name: string;
  kind: 'token' | 'market';

  // Signal-related
  primarySignal: SignalResult | null;
  signals: SignalResult[];
  severityRank: number;
  severityCounts: Record<SignalSeverity, number>;

  // Market metrics
  price: number | null;
  priceChange24h: number | null;
  volume24h: number | null;

  // Context
  watchlists: {
    id: string;
    name: string;
  }[];

  // Scoring (Milestone 30)
  score: number; // 0-100, rounded
  subScores: OpportunitySubScores;

  // Explainability (Milestone 32)
  explanation: OpportunityExplanation;

  // Indicators (Milestone 34)
  indicators?: {
    rsi?: number;
    macd?: { macd: number; signal: number; hist: number };
    bollinger?: { upper: number; middle: number; lower: number; bandwidth: number };
    atr?: { atr: number; atrPercent: number };
  };
}

export interface ListOpportunitiesParams {
  minSeverity?: SignalSeverity;
  signalKeys?: string[];
  watchlistId?: string;
  assetId?: string;
  sortBy?: 'score' | 'severity' | 'priceChange';
  structureFilters?: {
    trendlineBreak?: boolean;
    breakRetest?: boolean;
    srBreak?: boolean;
    srFlip?: boolean;
    liquiditySweep?: boolean;
    fvg?: boolean;
    fibDiscount?: boolean;
    fibPremium?: boolean;
  };
  indicatorFilters?: {
    rsiOverbought?: boolean;
    rsiOversold?: boolean;
    macdBullCross?: boolean;
    macdBearCross?: boolean;
    bbSqueeze?: boolean;
    bbTagUpper?: boolean;
    bbTagLower?: boolean;
    atrSpike?: boolean;
    atrCrush?: boolean;
  };
}

interface ItemAggregation {
  item: WatchlistItemEnriched;
  watchlists: { id: string; name: string }[];
}

/**
 * Calculate severity score (0-100) based on highest signal severity
 */
function calculateSeverityScore(signals: SignalResult[]): number {
  if (signals.length === 0) return 0;

  const severityMap: Record<SignalSeverity, number> = {
    none: 0,
    info: 25,
    watch: 50,
    action: 100,
  };

  let maxScore = 0;
  for (const signal of signals) {
    const score = severityMap[signal.severity];
    if (score > maxScore) {
      maxScore = score;
    }
  }

  return maxScore;
}

/**
 * Calculate signal density score (0-100) based on count of info+ signals
 */
function calculateSignalDensityScore(signals: SignalResult[]): number {
  const relevantSignals = signals.filter(
    (s) => s.severity === 'info' || s.severity === 'watch' || s.severity === 'action'
  );

  const count = Math.min(relevantSignals.length, 4);
  return (count / 4) * 100;
}

/**
 * Calculate price momentum score (0-100) based on 24h price change
 * -10% -> 0, 0% -> 50, +10% -> 100
 */
function calculatePriceMomentumScore(priceChange24h: number | null): number {
  if (priceChange24h === null) return 50; // neutral

  // Linear mapping: -10% -> 0, 0% -> 50, +10% -> 100
  const normalized = (priceChange24h + 10) / 20; // Maps [-10, +10] to [0, 1]
  const score = normalized * 100;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate volume score (0-100) based on relative volume in the batch
 */
function calculateVolumeScore(
  volume24h: number | null,
  allVolumes: (number | null)[]
): number {
  if (volume24h === null) return 50; // neutral

  // Collect all non-null volumes
  const validVolumes = allVolumes.filter((v): v is number => v !== null);

  if (validVolumes.length === 0) return 50; // no volumes to compare

  const minVol = Math.min(...validVolumes);
  const maxVol = Math.max(...validVolumes);

  if (maxVol === minVol) return 50; // all equal

  // Linear interpolation
  const normalized = (volume24h - minVol) / (maxVol - minVol);
  return normalized * 100;
}

/**
 * Calculate EMA (Exponential Moving Average) for a price series
 */
function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  const k = 2 / (period + 1); // Smoothing factor
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculate trend score (0-100) based on EMA crossover
 */
async function calculateTrendScore(assetId: string): Promise<number> {
  try {
    const history = await getPriceHistoryForAsset(assetId);
    if (history.length < 26) return 50; // not enough data

    const prices = history.map((p) => p.price);

    const emaShort = calculateEMA(prices, 12);
    const emaLong = calculateEMA(prices, 26);

    if (emaShort === null || emaLong === null) return 50; // can't compute

    const diffPct = ((emaShort - emaLong) / emaLong) * 100;

    // Map diffPct to trend score
    if (diffPct >= 3) return 100; // strong uptrend
    if (diffPct >= 1) return 75; // uptrend
    if (diffPct > -1) return 50; // flat
    if (diffPct > -3) return 25; // downtrend
    return 0; // strong downtrend
  } catch {
    return 50; // neutral on error
  }
}

/**
 * Calculate preference alignment score (0-100) based on user signal preferences
 */
function calculatePreferenceAlignmentScore(
  signals: SignalResult[],
  preferences: Awaited<ReturnType<typeof getCurrentUserSignalPreferences>>
): number {
  if (!preferences) return 50; // neutral if no preferences

  const enabledSignalIds = new Set(
    preferences.signalPreferences
      .filter((pref) => pref.enabled)
      .map((pref) => pref.signalId)
  );

  // Count matching enabled signals
  let matchCount = 0;
  for (const signal of signals) {
    if (enabledSignalIds.has(signal.id)) {
      matchCount++;
    }
  }

  // +20 points per match, capped at 100
  return Math.min(matchCount * 20, 100);
}

/**
 * Calculate overall opportunity score (0-100) using weighted sub-scores
 */
function calculateOverallScore(subScores: OpportunitySubScores): number {
  const score =
    subScores.severity * 0.3 +
    subScores.signalDensity * 0.2 +
    subScores.priceMomentum * 0.15 +
    subScores.volume * 0.15 +
    subScores.trend * 0.1 +
    subScores.preferenceAlignment * 0.1;

  // Clamp to [0, 100] and round
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Enrich opportunity with structure-based signals (Milestone 33)
 * Returns existing signals + structure signals with minimal scoring boost
 */
function enrichWithStructureSignals(
  candles: Awaited<ReturnType<typeof getCandlestickData>>,
  existingSignals: SignalResult[],
  disabledSignalIds: Set<string>
): SignalResult[] {
  try {
    if (candles.length < 10) {
      // Not enough data for structure analysis
      return existingSignals;
    }

    // Detect structure signals
    const structureSignals = detectStructureSignals(candles);

    // Filter out disabled structure signals
    const enabledStructureSignals = structureSignals.filter(
      (signal) => !disabledSignalIds.has(signal.id)
    );

    // Merge with existing signals
    return [...existingSignals, ...enabledStructureSignals];
  } catch (error) {
    // On error, return existing signals without enrichment
    console.error('Failed to detect structure signals:', error);
    return existingSignals;
  }
}

/**
 * Calculate structure bonus (0-10 points) based on structure signal count and severity
 * Provides minimal boost to opportunities with strong structure confluence
 */
function calculateStructureBonus(signals: SignalResult[]): number {
  const structureSignalIds = new Set([
    'trendline_break_up',
    'trendline_break_down',
    'trendline_break_retest',
    'support_break',
    'resistance_break',
    'support_flip',
    'resistance_flip',
    'liquidity_sweep_up',
    'liquidity_sweep_down',
    'fvg_bullish',
    'fvg_bearish',
    'discount_retrace',
    'premium_retrace',
  ]);

  const structureSignals = signals.filter((s) => structureSignalIds.has(s.id));

  if (structureSignals.length === 0) return 0;

  // Count by severity
  const actionCount = structureSignals.filter((s) => s.severity === 'action').length;
  const watchCount = structureSignals.filter((s) => s.severity === 'watch').length;
  const infoCount = structureSignals.filter((s) => s.severity === 'info').length;

  // Bonus: +5 for each action, +3 for each watch, +1 for each info, capped at 10
  const bonus = actionCount * 5 + watchCount * 3 + infoCount * 1;

  return Math.min(bonus, 10);
}

/**
 * Enrich opportunity with indicator-based signals (Milestone 34)
 * Returns existing signals + indicator signals + raw indicator values
 */
function enrichWithIndicatorSignals(
  candles: Awaited<ReturnType<typeof getCandlestickData>>,
  existingSignals: SignalResult[],
  disabledSignalIds: Set<string>
): { signals: SignalResult[]; indicators: IndicatorSignals } {
  try {
    if (candles.length < 30) {
      // Not enough data for indicator analysis
      return {
        signals: existingSignals,
        indicators: { signals: [] },
      };
    }

    // Analyze indicators
    const indicatorData = analyzeIndicators(candles);

    // Filter out disabled indicator signals
    const enabledIndicatorSignals = indicatorData.signals.filter(
      (signal) => !disabledSignalIds.has(signal.id)
    );

    // Merge with existing signals
    return {
      signals: [...existingSignals, ...enabledIndicatorSignals],
      indicators: indicatorData,
    };
  } catch (error) {
    // On error, return existing signals without enrichment
    console.error('Failed to analyze indicators:', error);
    return {
      signals: existingSignals,
      indicators: { signals: [] },
    };
  }
}

/**
 * Calculate indicator bonus (0-10 points) based on indicator signal confluence
 * Provides minimal boost for strong indicator setups
 */
function calculateIndicatorBonus(signals: SignalResult[], priceChange24h: number | null): number {
  const indicatorSignalIds = new Set([
    'rsi_overbought',
    'rsi_oversold',
    'macd_bull_cross',
    'macd_bear_cross',
    'macd_histogram_expand',
    'bb_squeeze',
    'bb_expand',
    'bb_tag_upper',
    'bb_tag_lower',
    'atr_spike',
    'atr_crush',
  ]);

  const indicatorSignals = signals.filter((s) => indicatorSignalIds.has(s.id));

  if (indicatorSignals.length === 0) return 0;

  let bonus = 0;

  // Check for bullish confluences
  const hasMacdBullCross = indicatorSignals.some((s) => s.id === 'macd_bull_cross');
  const hasRsiOversold = indicatorSignals.some((s) => s.id === 'rsi_oversold');
  const hasBbSqueeze = indicatorSignals.some((s) => s.id === 'bb_squeeze');
  const isUptrending = priceChange24h !== null && priceChange24h > 0;

  // Bullish MACD cross + uptrend: +5
  if (hasMacdBullCross && isUptrending) {
    bonus += 5;
  }

  // RSI oversold + uptrend: +3
  if (hasRsiOversold && isUptrending) {
    bonus += 3;
  }

  // Bollinger squeeze + high volume: +4 (squeeze suggests breakout incoming)
  if (hasBbSqueeze) {
    bonus += 4;
  }

  // Check for bearish confluences
  const hasMacdBearCross = indicatorSignals.some((s) => s.id === 'macd_bear_cross');
  const hasRsiOverbought = indicatorSignals.some((s) => s.id === 'rsi_overbought');
  const isDowntrending = priceChange24h !== null && priceChange24h < 0;

  // Bearish MACD cross + downtrend: +5
  if (hasMacdBearCross && isDowntrending) {
    bonus += 5;
  }

  // RSI overbought + downtrend: +3
  if (hasRsiOverbought && isDowntrending) {
    bonus += 3;
  }

  // Cap at 10 points
  return Math.min(bonus, 10);
}

export async function listOpportunities(
  params: ListOpportunitiesParams = {},
): Promise<Opportunity[]> {
  const { minSeverity, signalKeys, watchlistId, assetId, sortBy = 'score' } = params;

  // Get user preferences
  const preferences = await getCurrentUserSignalPreferences();

  // Determine effective minSeverity: explicit param > preference > default ('info')
  const effectiveMinSeverity = minSeverity ?? preferences?.defaultMinSeverity ?? 'info';

  // Build set of disabled signal IDs from preferences
  const disabledSignalIds = new Set(
    preferences?.signalPreferences
      .filter((pref) => !pref.enabled)
      .map((pref) => pref.signalId) ?? []
  );

  // Fetch all enriched watchlists
  const watchlists = await listWatchlistsEnriched();

  // Build a map to aggregate items by ID (same item can appear in multiple watchlists)
  const itemMap = new Map<string, ItemAggregation>();

  for (const watchlist of watchlists) {
    // Skip if filtering by watchlistId and this isn't the target
    if (watchlistId && watchlist.id !== watchlistId) {
      continue;
    }

    for (const item of watchlist.items) {
      const existing = itemMap.get(item.id);

      if (existing) {
        // Item already seen, just add this watchlist to the list
        existing.watchlists.push({ id: watchlist.id, name: watchlist.name });
      } else {
        // First time seeing this item
        itemMap.set(item.id, {
          item,
          watchlists: [{ id: watchlist.id, name: watchlist.name }],
        });
      }
    }
  }

  // Convert to array and apply filters
  let aggregations = Array.from(itemMap.values());

  // Filter by assetId
  if (assetId) {
    aggregations = aggregations.filter((agg) => agg.item.id === assetId);
  }

  // Filter out disabled signals from each item
  aggregations = aggregations.map((agg) => ({
    ...agg,
    item: {
      ...agg.item,
      signals: agg.item.signals.filter((signal) => !disabledSignalIds.has(signal.id)),
    },
  }));

  // Filter by minSeverity (use effectiveMinSeverity)
  aggregations = aggregations.filter((agg) =>
    hasSignalAtOrAbove(agg.item.signals, effectiveMinSeverity)
  );

  // Filter by signalKeys (if explicitly provided)
  if (signalKeys && signalKeys.length > 0) {
    aggregations = aggregations.filter((agg) =>
      agg.item.signals.some((s) => signalKeys.includes(s.id))
    );
  }

  // Collect all volumes for relative volume scoring
  const allVolumes = aggregations.map((agg) => agg.item.volume24h ?? null);

  // Build opportunities with computed fields (without scoring yet)
  const opportunitiesWithoutScores = aggregations.map((agg) => {
    const { item, watchlists: itemWatchlists } = agg;
    const primarySignal = getPrimarySignal(item.signals) ?? null;
    const severityRank = primarySignal
      ? getSeverityRank(primarySignal.severity)
      : 0;
    const severityCounts = countSignalsBySeverity(item.signals);

    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      kind: item.kind,
      primarySignal,
      signals: item.signals,
      severityRank,
      severityCounts,
      price: item.price ?? null,
      priceChange24h: item.priceChange24h ?? null,
      volume24h: item.volume24h ?? null,
      watchlists: itemWatchlists,
    };
  });

  // Calculate scores for all opportunities
  let opportunities: Opportunity[] = await Promise.all(
    opportunitiesWithoutScores.map(async (opp) => {
      // Fetch candlestick data once for both structure and indicator analysis
      let candles: Awaited<ReturnType<typeof getCandlestickData>> = [];
      try {
        candles = await getCandlestickData(opp.id);
      } catch (error) {
        console.error('Failed to fetch candlestick data:', error);
      }

      // Enrich with structure-based signals (Milestone 33)
      let enrichedSignals = enrichWithStructureSignals(
        candles,
        opp.signals,
        disabledSignalIds
      );

      // Enrich with indicator-based signals (Milestone 34)
      const indicatorEnrichment = enrichWithIndicatorSignals(
        candles,
        enrichedSignals,
        disabledSignalIds
      );
      enrichedSignals = indicatorEnrichment.signals;
      const indicators = indicatorEnrichment.indicators;

      // Recalculate primary signal and counts with enriched signals
      const primarySignal = getPrimarySignal(enrichedSignals) ?? null;
      const severityRank = primarySignal ? getSeverityRank(primarySignal.severity) : 0;
      const severityCounts = countSignalsBySeverity(enrichedSignals);

      // Calculate sub-scores with enriched signals
      const severityScore = calculateSeverityScore(enrichedSignals);
      const signalDensityScore = calculateSignalDensityScore(enrichedSignals);
      const priceMomentumScore = calculatePriceMomentumScore(opp.priceChange24h);
      const volumeScore = calculateVolumeScore(opp.volume24h, allVolumes);
      const trendScore = await calculateTrendScore(opp.id);
      const preferenceAlignmentScore = calculatePreferenceAlignmentScore(
        enrichedSignals,
        preferences
      );

      const subScores: OpportunitySubScores = {
        severity: severityScore,
        signalDensity: signalDensityScore,
        priceMomentum: priceMomentumScore,
        volume: volumeScore,
        trend: trendScore,
        preferenceAlignment: preferenceAlignmentScore,
      };

      // Calculate base score
      let score = calculateOverallScore(subScores);

      // Add structure bonus (Milestone 33: +5 to +10 max)
      const structureBonus = calculateStructureBonus(enrichedSignals);
      score = Math.min(100, score + structureBonus);

      // Add indicator bonus (Milestone 34: +5 to +10 max)
      const indicatorBonus = calculateIndicatorBonus(enrichedSignals, opp.priceChange24h);
      score = Math.min(100, score + indicatorBonus);

      // Build explanation (Milestone 32)
      const explanation = buildOpportunityExplanation(subScores);

      return {
        ...opp,
        primarySignal,
        signals: enrichedSignals,
        severityRank,
        severityCounts,
        score,
        subScores,
        explanation,
        indicators: {
          rsi: indicators.rsi,
          macd: indicators.macd,
          bollinger: indicators.bollinger,
          atr: indicators.atr,
        },
      };
    })
  );

  // Filter by structure filters (Milestone 33)
  if (params.structureFilters) {
    const filters = params.structureFilters;

    opportunities = opportunities.filter((opp) => {
      const signalIds = new Set(opp.signals.map(s => s.id));

      // Check each enabled filter - opportunity must have at least one matching signal
      if (filters.trendlineBreak && !signalIds.has('trendline_break_up') && !signalIds.has('trendline_break_down')) {
        return false;
      }
      if (filters.breakRetest && !signalIds.has('trendline_break_retest')) {
        return false;
      }
      if (filters.srBreak && !signalIds.has('support_break') && !signalIds.has('resistance_break')) {
        return false;
      }
      if (filters.srFlip && !signalIds.has('support_flip') && !signalIds.has('resistance_flip')) {
        return false;
      }
      if (filters.liquiditySweep && !signalIds.has('liquidity_sweep_up') && !signalIds.has('liquidity_sweep_down')) {
        return false;
      }
      if (filters.fvg && !signalIds.has('fvg_bullish') && !signalIds.has('fvg_bearish')) {
        return false;
      }
      if (filters.fibDiscount && !signalIds.has('discount_retrace')) {
        return false;
      }
      if (filters.fibPremium && !signalIds.has('premium_retrace')) {
        return false;
      }

      return true;
    });
  }

  // Filter by indicator filters (Milestone 34)
  if (params.indicatorFilters) {
    const filters = params.indicatorFilters;

    opportunities = opportunities.filter((opp) => {
      const signalIds = new Set(opp.signals.map(s => s.id));

      // Check each enabled filter - opportunity must have the matching signal
      if (filters.rsiOverbought && !signalIds.has('rsi_overbought')) {
        return false;
      }
      if (filters.rsiOversold && !signalIds.has('rsi_oversold')) {
        return false;
      }
      if (filters.macdBullCross && !signalIds.has('macd_bull_cross')) {
        return false;
      }
      if (filters.macdBearCross && !signalIds.has('macd_bear_cross')) {
        return false;
      }
      if (filters.bbSqueeze && !signalIds.has('bb_squeeze')) {
        return false;
      }
      if (filters.bbTagUpper && !signalIds.has('bb_tag_upper')) {
        return false;
      }
      if (filters.bbTagLower && !signalIds.has('bb_tag_lower')) {
        return false;
      }
      if (filters.atrSpike && !signalIds.has('atr_spike')) {
        return false;
      }
      if (filters.atrCrush && !signalIds.has('atr_crush')) {
        return false;
      }

      return true;
    });
  }

  // Sort based on sortBy parameter
  if (sortBy === 'score') {
    // Sort by score descending (highest first)
    opportunities.sort((a, b) => b.score - a.score);
  } else if (sortBy === 'severity') {
    // Sort by severityRank desc, then priceChange24h desc (null = lowest)
    opportunities.sort((a, b) => {
      // Primary sort: severityRank descending
      if (b.severityRank !== a.severityRank) {
        return b.severityRank - a.severityRank;
      }

      // Secondary sort: priceChange24h descending (null treated as -Infinity)
      const changeA = a.priceChange24h ?? -Infinity;
      const changeB = b.priceChange24h ?? -Infinity;
      return changeB - changeA;
    });
  } else if (sortBy === 'priceChange') {
    // Sort by priceChange24h descending (null = lowest)
    opportunities.sort((a, b) => {
      const changeA = a.priceChange24h ?? -Infinity;
      const changeB = b.priceChange24h ?? -Infinity;
      return changeB - changeA;
    });
  }

  return opportunities;
}

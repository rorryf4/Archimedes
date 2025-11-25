/**
 * Price Action / ICT Structure Analysis (Milestone 33)
 *
 * Detects swing highs/lows, trendlines, support/resistance, liquidity pools,
 * fair value gaps (FVG), and Fibonacci retracement zones.
 */

import type { CandlePoint } from '../markets/candles';
import type { SignalResult } from '../signals/types';

/**
 * Swing point detected in price action
 */
interface SwingPoint {
  index: number;
  price: number;
  timestamp: number;
  type: 'high' | 'low';
}

/**
 * Trendline connecting swing points
 */
interface Trendline {
  points: SwingPoint[];
  slope: number;
  type: 'uptrend' | 'downtrend';
}

/**
 * Support or resistance level
 */
interface SRLevel {
  price: number;
  strength: number; // Number of touches
  type: 'support' | 'resistance';
}

/**
 * Fair Value Gap structure
 */
interface FVG {
  startIndex: number;
  endIndex: number;
  gapTop: number;
  gapBottom: number;
  type: 'bullish' | 'bearish';
}

/**
 * Detect swing highs and swing lows using a lookback window
 * A swing high is higher than N candles before and after
 * A swing low is lower than N candles before and after
 */
function detectSwingPoints(candles: CandlePoint[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];

    // Check for swing high
    let isSwingHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high >= current.high) {
        isSwingHigh = false;
        break;
      }
    }

    if (isSwingHigh) {
      swings.push({
        index: i,
        price: current.high,
        timestamp: current.timestamp,
        type: 'high',
      });
    }

    // Check for swing low
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].low <= current.low || candles[i + j].low <= current.low) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingLow) {
      swings.push({
        index: i,
        price: current.low,
        timestamp: current.timestamp,
        type: 'low',
      });
    }
  }

  return swings;
}

/**
 * Detect trendlines from swing points
 */
function detectTrendlines(swings: SwingPoint[], candles: CandlePoint[]): Trendline[] {
  const trendlines: Trendline[] = [];

  // Uptrend: Connect recent swing lows
  const swingLows = swings.filter((s) => s.type === 'low').slice(-3);
  if (swingLows.length >= 2) {
    const sorted = [...swingLows].sort((a, b) => a.index - b.index);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const slope = (last.price - first.price) / (last.index - first.index);

    // Valid uptrend has positive slope
    if (slope > 0) {
      trendlines.push({
        points: sorted,
        slope,
        type: 'uptrend',
      });
    }
  }

  // Downtrend: Connect recent swing highs
  const swingHighs = swings.filter((s) => s.type === 'high').slice(-3);
  if (swingHighs.length >= 2) {
    const sorted = [...swingHighs].sort((a, b) => a.index - b.index);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const slope = (last.price - first.price) / (last.index - first.index);

    // Valid downtrend has negative slope
    if (slope < 0) {
      trendlines.push({
        points: sorted,
        slope,
        type: 'downtrend',
      });
    }
  }

  return trendlines;
}

/**
 * Check if a trendline was recently broken
 */
function detectTrendlineBreak(trendline: Trendline, candles: CandlePoint[]): boolean {
  if (candles.length < 3) return false;

  const lastCandle = candles[candles.length - 1];
  const lastPoint = trendline.points[trendline.points.length - 1];

  // Calculate expected trendline price at last candle
  const indexDiff = candles.length - 1 - lastPoint.index;
  const expectedPrice = lastPoint.price + trendline.slope * indexDiff;

  // Uptrend break: price closes below trendline
  if (trendline.type === 'uptrend' && lastCandle.close < expectedPrice) {
    return true;
  }

  // Downtrend break: price closes above trendline
  if (trendline.type === 'downtrend' && lastCandle.close > expectedPrice) {
    return true;
  }

  return false;
}

/**
 * Check if trendline was broken and retested (break + retest pattern)
 */
function detectBreakRetest(trendline: Trendline, candles: CandlePoint[]): boolean {
  if (candles.length < 5) return false;

  // Check last 5 candles for break + retest pattern
  const recentCandles = candles.slice(-5);
  const lastPoint = trendline.points[trendline.points.length - 1];

  let breakIndex = -1;

  // Find break
  for (let i = 0; i < recentCandles.length - 2; i++) {
    const candle = recentCandles[i];
    const indexDiff = candles.length - 5 + i - lastPoint.index;
    const expectedPrice = lastPoint.price + trendline.slope * indexDiff;

    if (trendline.type === 'uptrend' && candle.close < expectedPrice) {
      breakIndex = i;
      break;
    }
    if (trendline.type === 'downtrend' && candle.close > expectedPrice) {
      breakIndex = i;
      break;
    }
  }

  // If break found, check for retest
  if (breakIndex >= 0 && breakIndex < recentCandles.length - 1) {
    for (let i = breakIndex + 1; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const indexDiff = candles.length - 5 + i - lastPoint.index;
      const expectedPrice = lastPoint.price + trendline.slope * indexDiff;

      // Retest: price comes back near trendline but doesn't fully cross back
      const tolerance = Math.abs(expectedPrice) * 0.02; // 2% tolerance
      if (Math.abs(candle.close - expectedPrice) < tolerance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect support and resistance levels from swing points
 */
function detectSRLevels(swings: SwingPoint[], tolerance: number = 0.01): SRLevel[] {
  const levels: SRLevel[] = [];

  // Group swing highs into resistance clusters
  const swingHighs = swings.filter((s) => s.type === 'high');
  const resistanceClusters = clusterPrices(
    swingHighs.map((s) => s.price),
    tolerance
  );

  resistanceClusters.forEach((cluster) => {
    levels.push({
      price: cluster.price,
      strength: cluster.count,
      type: 'resistance',
    });
  });

  // Group swing lows into support clusters
  const swingLows = swings.filter((s) => s.type === 'low');
  const supportClusters = clusterPrices(
    swingLows.map((s) => s.price),
    tolerance
  );

  supportClusters.forEach((cluster) => {
    levels.push({
      price: cluster.price,
      strength: cluster.count,
      type: 'support',
    });
  });

  return levels;
}

/**
 * Cluster prices within tolerance
 */
function clusterPrices(prices: number[], tolerance: number): { price: number; count: number }[] {
  if (prices.length === 0) return [];

  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: { price: number; count: number }[] = [];
  let currentCluster: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i] - currentCluster[0]) / currentCluster[0];

    if (diff <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      // Finalize current cluster
      const avgPrice = currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length;
      clusters.push({ price: avgPrice, count: currentCluster.length });

      // Start new cluster
      currentCluster = [sorted[i]];
    }
  }

  // Finalize last cluster
  if (currentCluster.length > 0) {
    const avgPrice = currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length;
    clusters.push({ price: avgPrice, count: currentCluster.length });
  }

  // Only return clusters with multiple touches (strength >= 2)
  return clusters.filter((c) => c.count >= 2);
}

/**
 * Check if an S/R level was recently broken
 */
function detectSRBreak(level: SRLevel, candles: CandlePoint[]): boolean {
  if (candles.length < 2) return false;

  const lastCandle = candles[candles.length - 1];

  if (level.type === 'support' && lastCandle.close < level.price) {
    return true;
  }

  if (level.type === 'resistance' && lastCandle.close > level.price) {
    return true;
  }

  return false;
}

/**
 * Check if an S/R level flipped (break + retest from opposite side)
 */
function detectSRFlip(level: SRLevel, candles: CandlePoint[]): boolean {
  if (candles.length < 5) return false;

  const recentCandles = candles.slice(-5);
  let breakIndex = -1;

  // Find break
  for (let i = 0; i < recentCandles.length - 2; i++) {
    const candle = recentCandles[i];
    if (level.type === 'support' && candle.close < level.price) {
      breakIndex = i;
      break;
    }
    if (level.type === 'resistance' && candle.close > level.price) {
      breakIndex = i;
      break;
    }
  }

  // Check for retest from opposite side
  if (breakIndex >= 0 && breakIndex < recentCandles.length - 1) {
    for (let i = breakIndex + 1; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const tolerance = level.price * 0.015; // 1.5% tolerance

      // Support flip: broke below, now testing from below (former support is now resistance)
      if (level.type === 'support' && Math.abs(candle.high - level.price) < tolerance) {
        return true;
      }

      // Resistance flip: broke above, now testing from above (former resistance is now support)
      if (level.type === 'resistance' && Math.abs(candle.low - level.price) < tolerance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect equal highs or equal lows (liquidity pools)
 */
function detectEqualPrices(swings: SwingPoint[], tolerance: number = 0.005): SwingPoint[][] {
  const pools: SwingPoint[][] = [];

  // Group by type
  const highs = swings.filter((s) => s.type === 'high');
  const lows = swings.filter((s) => s.type === 'low');

  // Find equal highs
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const diff = Math.abs(highs[i].price - highs[j].price) / highs[i].price;
      if (diff <= tolerance) {
        pools.push([highs[i], highs[j]]);
      }
    }
  }

  // Find equal lows
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const diff = Math.abs(lows[i].price - lows[j].price) / lows[i].price;
      if (diff <= tolerance) {
        pools.push([lows[i], lows[j]]);
      }
    }
  }

  return pools;
}

/**
 * Detect liquidity sweep (price briefly breaks equal high/low then reverses)
 */
function detectLiquiditySweep(pool: SwingPoint[], candles: CandlePoint[]): boolean {
  if (candles.length < 3 || pool.length < 2) return false;

  const poolPrice = pool[0].price;
  const poolType = pool[0].type;
  const recentCandles = candles.slice(-3);

  // Look for sweep pattern: wick beyond level, close back inside
  for (const candle of recentCandles) {
    if (poolType === 'high') {
      // Sweep high: high exceeds level but close is below
      if (candle.high > poolPrice && candle.close < poolPrice) {
        return true;
      }
    } else {
      // Sweep low: low breaks below level but close is above
      if (candle.low < poolPrice && candle.close > poolPrice) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect Fair Value Gaps (3-candle structure with gap)
 */
function detectFVGs(candles: CandlePoint[]): FVG[] {
  const fvgs: FVG[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    const next = candles[i + 1];

    // Bullish FVG: gap between prev.high and next.low (with current in between)
    if (next.low > prev.high) {
      fvgs.push({
        startIndex: i - 1,
        endIndex: i + 1,
        gapTop: next.low,
        gapBottom: prev.high,
        type: 'bullish',
      });
    }

    // Bearish FVG: gap between prev.low and next.high (with current in between)
    if (next.high < prev.low) {
      fvgs.push({
        startIndex: i - 1,
        endIndex: i + 1,
        gapTop: prev.low,
        gapBottom: next.high,
        type: 'bearish',
      });
    }
  }

  return fvgs;
}

/**
 * Detect Fibonacci retracement zones (premium 62-79%, discount 21-38%)
 */
function detectFibZones(candles: CandlePoint[]): {
  discount: boolean;
  premium: boolean;
  currentPrice: number;
  swingHigh: number;
  swingLow: number;
} | null {
  if (candles.length < 10) return null;

  // Use last 20 candles to find swing high/low
  const recentCandles = candles.slice(-20);
  const prices = recentCandles.map((c) => c.close);
  const swingHigh = Math.max(...prices);
  const swingLow = Math.min(...prices);
  const range = swingHigh - swingLow;

  if (range === 0) return null;

  const currentPrice = candles[candles.length - 1].close;
  const retracement = (currentPrice - swingLow) / range;

  // Discount zone: 0.21 - 0.38 (closer to swing low)
  const inDiscount = retracement >= 0.21 && retracement <= 0.38;

  // Premium zone: 0.62 - 0.79 (closer to swing high)
  const inPremium = retracement >= 0.62 && retracement <= 0.79;

  return {
    discount: inDiscount,
    premium: inPremium,
    currentPrice,
    swingHigh,
    swingLow,
  };
}

/**
 * Main structure detection function
 * Returns array of detected structure-based signals
 */
export function detectStructureSignals(candles: CandlePoint[]): SignalResult[] {
  const signals: SignalResult[] = [];

  if (candles.length < 10) {
    // Not enough data for structure analysis
    return signals;
  }

  // Detect swing points
  const swings = detectSwingPoints(candles, 5);

  // Detect trendlines
  const trendlines = detectTrendlines(swings, candles);

  // Check for trendline breaks
  for (const trendline of trendlines) {
    if (detectTrendlineBreak(trendline, candles)) {
      signals.push({
        id: trendline.type === 'uptrend' ? 'trendline_break_down' : 'trendline_break_up',
        label: trendline.type === 'uptrend' ? 'Uptrend Break' : 'Downtrend Break',
        value: null,
        unit: null,
        severity: 'watch',
        timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
      });
    }

    // Check for break + retest
    if (detectBreakRetest(trendline, candles)) {
      signals.push({
        id: 'trendline_break_retest',
        label: 'Trendline Break & Retest',
        value: null,
        unit: null,
        severity: 'action',
        timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
      });
    }
  }

  // Detect S/R levels
  const srLevels = detectSRLevels(swings, 0.01);

  // Check for S/R breaks
  for (const level of srLevels) {
    if (detectSRBreak(level, candles)) {
      signals.push({
        id: level.type === 'support' ? 'support_break' : 'resistance_break',
        label: level.type === 'support' ? 'Support Break' : 'Resistance Break',
        value: level.price,
        unit: null,
        severity: 'watch',
        timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
      });
    }

    // Check for S/R flip
    if (detectSRFlip(level, candles)) {
      signals.push({
        id: level.type === 'support' ? 'support_flip' : 'resistance_flip',
        label: level.type === 'support' ? 'Support Flip' : 'Resistance Flip',
        value: level.price,
        unit: null,
        severity: 'action',
        timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
      });
    }
  }

  // Detect equal highs/lows and liquidity sweeps
  const equalPricePools = detectEqualPrices(swings, 0.005);

  for (const pool of equalPricePools) {
    if (detectLiquiditySweep(pool, candles)) {
      const poolType = pool[0].type;
      signals.push({
        id: poolType === 'high' ? 'liquidity_sweep_down' : 'liquidity_sweep_up',
        label: poolType === 'high' ? 'Liquidity Sweep (Highs)' : 'Liquidity Sweep (Lows)',
        value: pool[0].price,
        unit: null,
        severity: 'action',
        timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
      });
    }
  }

  // Detect FVGs
  const fvgs = detectFVGs(candles);
  const recentFVGs = fvgs.slice(-2); // Only look at most recent

  for (const fvg of recentFVGs) {
    signals.push({
      id: fvg.type === 'bullish' ? 'fvg_bullish' : 'fvg_bearish',
      label: fvg.type === 'bullish' ? 'Bullish FVG' : 'Bearish FVG',
      value: (fvg.gapTop + fvg.gapBottom) / 2,
      unit: null,
      severity: 'info',
      timestamp: new Date(candles[fvg.endIndex].timestamp).toISOString(),
    });
  }

  // Detect Fib zones
  const fibZones = detectFibZones(candles);

  if (fibZones?.discount) {
    signals.push({
      id: 'discount_retrace',
      label: 'Fib Discount Zone (21-38%)',
      value: fibZones.currentPrice,
      unit: null,
      severity: 'info',
      timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
    });
  }

  if (fibZones?.premium) {
    signals.push({
      id: 'premium_retrace',
      label: 'Fib Premium Zone (62-79%)',
      value: fibZones.currentPrice,
      unit: null,
      severity: 'info',
      timestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
    });
  }

  return signals;
}

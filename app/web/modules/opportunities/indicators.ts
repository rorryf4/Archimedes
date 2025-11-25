/**
 * Technical Indicators Analysis (Milestone 34)
 *
 * Implements RSI, MACD, Bollinger Bands, and ATR indicators.
 * Generates signals based on indicator conditions.
 */

import type { CandlePoint } from '../markets/candles';
import type { SignalResult } from '../signals/types';

export interface IndicatorSignals {
  signals: SignalResult[];
  rsi?: number;
  macd?: { macd: number; signal: number; hist: number };
  bollinger?: { upper: number; middle: number; lower: number; bandwidth: number };
  atr?: { atr: number; atrPercent: number };
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  const k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  // Calculate average gain and loss using EMA
  const avgGain = calculateEMA(gains, period);
  const avgLoss = calculateEMA(losses, period);

  if (avgGain === null || avgLoss === null || avgLoss === 0) return null;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; hist: number } | null {
  if (prices.length < slowPeriod) return null;

  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);

  if (emaFast === null || emaSlow === null) return null;

  const macd = emaFast - emaSlow;

  // For signal line, we need to calculate EMA of MACD values
  // We'll approximate by calculating MACD for recent candles and taking EMA
  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const fast = calculateEMA(slice, fastPeriod);
    const slow = calculateEMA(slice, slowPeriod);
    if (fast !== null && slow !== null) {
      macdValues.push(fast - slow);
    }
  }

  const signal = calculateEMA(macdValues, signalPeriod);
  if (signal === null) return null;

  const hist = macd - signal;

  return { macd, signal, hist };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; middle: number; lower: number; bandwidth: number } | null {
  if (prices.length < period) return null;

  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((sum, p) => sum + p, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = recentPrices.map((p) => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const bandwidth = ((upper - lower) / middle) * 100;

  return { upper, middle, lower, bandwidth };
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(candles: CandlePoint[], period: number = 14): { atr: number; atrPercent: number } | null {
  if (candles.length < period + 1) return null;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  const atr = calculateEMA(trueRanges, period);
  if (atr === null) return null;

  const currentPrice = candles[candles.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;

  return { atr, atrPercent };
}

/**
 * Detect RSI signals
 */
function detectRSISignals(rsi: number, timestamp: string): SignalResult[] {
  const signals: SignalResult[] = [];

  if (rsi >= 70) {
    signals.push({
      id: 'rsi_overbought',
      label: 'RSI Overbought',
      value: rsi,
      unit: null,
      severity: 'watch',
      timestamp,
    });
  } else if (rsi <= 30) {
    signals.push({
      id: 'rsi_oversold',
      label: 'RSI Oversold',
      value: rsi,
      unit: null,
      severity: 'watch',
      timestamp,
    });
  }

  return signals;
}

/**
 * Detect MACD signals
 */
function detectMACDSignals(
  currentMACD: { macd: number; signal: number; hist: number },
  previousMACD: { macd: number; signal: number; hist: number } | null,
  timestamp: string
): SignalResult[] {
  const signals: SignalResult[] = [];

  if (previousMACD) {
    // Bullish cross: MACD crosses above signal line
    if (previousMACD.macd <= previousMACD.signal && currentMACD.macd > currentMACD.signal) {
      signals.push({
        id: 'macd_bull_cross',
        label: 'MACD Bullish Cross',
        value: currentMACD.hist,
        unit: null,
        severity: 'action',
        timestamp,
      });
    }

    // Bearish cross: MACD crosses below signal line
    if (previousMACD.macd >= previousMACD.signal && currentMACD.macd < currentMACD.signal) {
      signals.push({
        id: 'macd_bear_cross',
        label: 'MACD Bearish Cross',
        value: currentMACD.hist,
        unit: null,
        severity: 'action',
        timestamp,
      });
    }

    // Histogram expansion: histogram growing in same direction
    const prevHistAbs = Math.abs(previousMACD.hist);
    const currHistAbs = Math.abs(currentMACD.hist);

    if (
      currHistAbs > prevHistAbs * 1.5 &&
      Math.sign(currentMACD.hist) === Math.sign(previousMACD.hist)
    ) {
      signals.push({
        id: 'macd_histogram_expand',
        label: 'MACD Histogram Expanding',
        value: currentMACD.hist,
        unit: null,
        severity: 'info',
        timestamp,
      });
    }
  }

  return signals;
}

/**
 * Detect Bollinger Bands signals
 */
function detectBollingerSignals(
  bollinger: { upper: number; middle: number; lower: number; bandwidth: number },
  currentPrice: number,
  historicalBandwidths: number[],
  timestamp: string
): SignalResult[] {
  const signals: SignalResult[] = [];

  // Squeeze: bandwidth in bottom 20% of recent history
  if (historicalBandwidths.length >= 20) {
    const sorted = [...historicalBandwidths].sort((a, b) => a - b);
    const percentile20 = sorted[Math.floor(sorted.length * 0.2)];

    if (bollinger.bandwidth <= percentile20) {
      signals.push({
        id: 'bb_squeeze',
        label: 'Bollinger Squeeze',
        value: bollinger.bandwidth,
        unit: '%',
        severity: 'watch',
        timestamp,
      });
    }

    // Expansion: bandwidth in top 20% of recent history
    const percentile80 = sorted[Math.floor(sorted.length * 0.8)];
    if (bollinger.bandwidth >= percentile80) {
      signals.push({
        id: 'bb_expand',
        label: 'Bollinger Expansion',
        value: bollinger.bandwidth,
        unit: '%',
        severity: 'info',
        timestamp,
      });
    }
  }

  // Tag upper band: price within 1% of upper band
  const upperDistance = ((bollinger.upper - currentPrice) / currentPrice) * 100;
  if (Math.abs(upperDistance) <= 1) {
    signals.push({
      id: 'bb_tag_upper',
      label: 'Bollinger Upper Tag',
      value: currentPrice,
      unit: null,
      severity: 'watch',
      timestamp,
    });
  }

  // Tag lower band: price within 1% of lower band
  const lowerDistance = ((currentPrice - bollinger.lower) / currentPrice) * 100;
  if (Math.abs(lowerDistance) <= 1) {
    signals.push({
      id: 'bb_tag_lower',
      label: 'Bollinger Lower Tag',
      value: currentPrice,
      unit: null,
      severity: 'watch',
      timestamp,
    });
  }

  return signals;
}

/**
 * Detect ATR signals
 */
function detectATRSignals(
  atr: { atr: number; atrPercent: number },
  historicalATRs: number[],
  timestamp: string
): SignalResult[] {
  const signals: SignalResult[] = [];

  if (historicalATRs.length >= 20) {
    const sorted = [...historicalATRs].sort((a, b) => a - b);
    const percentile80 = sorted[Math.floor(sorted.length * 0.8)];
    const percentile20 = sorted[Math.floor(sorted.length * 0.2)];

    // ATR spike: ATR in top 20%
    if (atr.atrPercent >= percentile80) {
      signals.push({
        id: 'atr_spike',
        label: 'ATR Spike (High Volatility)',
        value: atr.atrPercent,
        unit: '%',
        severity: 'info',
        timestamp,
      });
    }

    // ATR crush: ATR in bottom 20%
    if (atr.atrPercent <= percentile20) {
      signals.push({
        id: 'atr_crush',
        label: 'ATR Crush (Low Volatility)',
        value: atr.atrPercent,
        unit: '%',
        severity: 'info',
        timestamp,
      });
    }
  }

  return signals;
}

/**
 * Main export: Analyze all indicators and generate signals
 */
export function analyzeIndicators(candles: CandlePoint[]): IndicatorSignals {
  const signals: SignalResult[] = [];

  if (candles.length < 30) {
    // Not enough data for meaningful indicator analysis
    return { signals };
  }

  const closePrices = candles.map((c) => c.close);
  const latestCandle = candles[candles.length - 1];
  const timestamp = new Date(latestCandle.timestamp).toISOString();

  // RSI
  const rsi = calculateRSI(closePrices, 14);
  if (rsi !== null) {
    signals.push(...detectRSISignals(rsi, timestamp));
  }

  // MACD
  const macd = calculateMACD(closePrices, 12, 26, 9);
  let previousMACD: { macd: number; signal: number; hist: number } | null = null;

  if (candles.length >= 27) {
    const previousPrices = closePrices.slice(0, -1);
    previousMACD = calculateMACD(previousPrices, 12, 26, 9);
  }

  if (macd !== null) {
    signals.push(...detectMACDSignals(macd, previousMACD, timestamp));
  }

  // Bollinger Bands
  const bollinger = calculateBollingerBands(closePrices, 20, 2);
  const historicalBandwidths: number[] = [];

  if (bollinger !== null) {
    // Calculate historical bandwidths for context
    for (let i = 20; i <= candles.length; i++) {
      const slice = closePrices.slice(0, i);
      const bb = calculateBollingerBands(slice, 20, 2);
      if (bb !== null) {
        historicalBandwidths.push(bb.bandwidth);
      }
    }

    signals.push(
      ...detectBollingerSignals(bollinger, latestCandle.close, historicalBandwidths, timestamp)
    );
  }

  // ATR
  const atr = calculateATR(candles, 14);
  const historicalATRs: number[] = [];

  if (atr !== null) {
    // Calculate historical ATRs for context
    for (let i = 15; i <= candles.length; i++) {
      const slice = candles.slice(0, i);
      const a = calculateATR(slice, 14);
      if (a !== null) {
        historicalATRs.push(a.atrPercent);
      }
    }

    signals.push(...detectATRSignals(atr, historicalATRs, timestamp));
  }

  return {
    signals,
    rsi: rsi ?? undefined,
    macd: macd ?? undefined,
    bollinger: bollinger ?? undefined,
    atr: atr ?? undefined,
  };
}

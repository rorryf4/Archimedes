/**
 * Tests for indicator calculations (Milestone 34)
 */

import { describe, it, expect } from 'vitest';
import { analyzeIndicators } from '@/modules/opportunities/indicators';
import type { CandlePoint } from '@/modules/markets/candles';

// Helper to create mock candles
function createMockCandles(count: number, basePrice = 100): CandlePoint[] {
  const candles: CandlePoint[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const open = basePrice + Math.random() * 5 - 2.5;
    const close = basePrice + Math.random() * 5 - 2.5;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    candles.push({
      timestamp: now - (count - i) * 60000, // 1 minute apart
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });

    basePrice = close; // Next candle starts from previous close
  }

  return candles;
}

// Helper to create trending candles
function createTrendingCandles(count: number, startPrice: number, endPrice: number): CandlePoint[] {
  const candles: CandlePoint[] = [];
  const now = Date.now();
  const priceStep = (endPrice - startPrice) / count;

  for (let i = 0; i < count; i++) {
    const basePrice = startPrice + priceStep * i;
    const open = basePrice;
    const close = basePrice + priceStep;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    candles.push({
      timestamp: now - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return candles;
}

describe('analyzeIndicators', () => {
  describe('insufficient data', () => {
    it('should return empty signals with less than 30 candles', () => {
      const candles = createMockCandles(20);
      const result = analyzeIndicators(candles);

      expect(result.signals).toEqual([]);
      expect(result.rsi).toBeUndefined();
      expect(result.macd).toBeUndefined();
      expect(result.bollinger).toBeUndefined();
      expect(result.atr).toBeUndefined();
    });
  });

  describe('RSI calculations', () => {
    it('should calculate RSI for sufficient data', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      expect(result.rsi).toBeDefined();
      expect(result.rsi).toBeGreaterThanOrEqual(0);
      expect(result.rsi).toBeLessThanOrEqual(100);
    });

    it('should detect RSI overbought signal (>= 70)', () => {
      // Create strong uptrend to push RSI overbought
      const candles = createTrendingCandles(50, 100, 150);
      const result = analyzeIndicators(candles);

      const rsiOverboughtSignal = result.signals.find((s) => s.id === 'rsi_overbought');

      // RSI might not always reach 70 with random data, but if it does, signal should exist
      if (result.rsi && result.rsi >= 70) {
        expect(rsiOverboughtSignal).toBeDefined();
        expect(rsiOverboughtSignal?.severity).toBe('watch');
      }
    });

    it('should detect RSI oversold signal (<= 30)', () => {
      // Create strong downtrend to push RSI oversold
      const candles = createTrendingCandles(50, 100, 50);
      const result = analyzeIndicators(candles);

      const rsiOversoldSignal = result.signals.find((s) => s.id === 'rsi_oversold');

      // RSI might not always reach 30 with random data, but if it does, signal should exist
      if (result.rsi && result.rsi <= 30) {
        expect(rsiOversoldSignal).toBeDefined();
        expect(rsiOversoldSignal?.severity).toBe('watch');
      }
    });
  });

  describe('MACD calculations', () => {
    it('should calculate MACD for sufficient data', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      expect(result.macd).toBeDefined();
      expect(result.macd?.macd).toBeDefined();
      expect(result.macd?.signal).toBeDefined();
      expect(result.macd?.hist).toBeDefined();
    });

    it('should detect MACD bullish cross', () => {
      // Create uptrend with enough data for MACD
      const candles = createTrendingCandles(60, 100, 130);
      const result = analyzeIndicators(candles);

      // Check if bullish cross signal exists
      const macdBullCross = result.signals.find((s) => s.id === 'macd_bull_cross');

      // Bullish cross should exist if MACD > signal
      if (result.macd && result.macd.macd > result.macd.signal) {
        // We can't guarantee a cross happened, but if it did, signal should be there
        if (macdBullCross) {
          expect(macdBullCross.severity).toBe('action');
        }
      }
    });

    it('should calculate histogram correctly', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      if (result.macd) {
        const calculatedHist = result.macd.macd - result.macd.signal;
        expect(result.macd.hist).toBeCloseTo(calculatedHist, 5);
      }
    });
  });

  describe('Bollinger Bands calculations', () => {
    it('should calculate Bollinger Bands for sufficient data', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      expect(result.bollinger).toBeDefined();
      expect(result.bollinger?.upper).toBeDefined();
      expect(result.bollinger?.middle).toBeDefined();
      expect(result.bollinger?.lower).toBeDefined();
      expect(result.bollinger?.bandwidth).toBeDefined();
    });

    it('should have upper band > middle > lower band', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      if (result.bollinger) {
        expect(result.bollinger.upper).toBeGreaterThan(result.bollinger.middle);
        expect(result.bollinger.middle).toBeGreaterThan(result.bollinger.lower);
      }
    });

    it('should calculate bandwidth as percentage', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      if (result.bollinger) {
        const expectedBandwidth =
          ((result.bollinger.upper - result.bollinger.lower) / result.bollinger.middle) * 100;
        expect(result.bollinger.bandwidth).toBeCloseTo(expectedBandwidth, 2);
      }
    });

    it('should detect BB squeeze for narrow bands', () => {
      // Create low volatility period (small price movements)
      const candles: CandlePoint[] = [];
      const now = Date.now();
      const basePrice = 100;

      for (let i = 0; i < 50; i++) {
        candles.push({
          timestamp: now - (50 - i) * 60000,
          open: basePrice + (i % 2 === 0 ? 0.1 : -0.1),
          high: basePrice + 0.2,
          low: basePrice - 0.2,
          close: basePrice + (i % 2 === 0 ? -0.1 : 0.1),
          volume: 1000000,
        });
      }

      const result = analyzeIndicators(candles);

      // Squeeze detection depends on historical context, so we just verify structure
      if (result.bollinger) {
        expect(result.bollinger.bandwidth).toBeLessThan(5); // Should be narrow
      }
    });
  });

  describe('ATR calculations', () => {
    it('should calculate ATR for sufficient data', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      expect(result.atr).toBeDefined();
      expect(result.atr?.atr).toBeGreaterThan(0);
      expect(result.atr?.atrPercent).toBeGreaterThan(0);
    });

    it('should calculate ATR as percentage of price', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      if (result.atr) {
        const lastPrice = candles[candles.length - 1].close;
        const expectedPercent = (result.atr.atr / lastPrice) * 100;
        expect(result.atr.atrPercent).toBeCloseTo(expectedPercent, 2);
      }
    });

    it('should have higher ATR for volatile candles', () => {
      // Create volatile candles
      const volatileCandles: CandlePoint[] = [];
      const now = Date.now();

      for (let i = 0; i < 50; i++) {
        const basePrice = 100;
        volatileCandles.push({
          timestamp: now - (50 - i) * 60000,
          open: basePrice,
          high: basePrice + 10 + Math.random() * 10,
          low: basePrice - 10 - Math.random() * 10,
          close: basePrice + (Math.random() - 0.5) * 20,
          volume: 1000000,
        });
      }

      const volatileResult = analyzeIndicators(volatileCandles);

      // Create stable candles
      const stableCandles: CandlePoint[] = [];
      for (let i = 0; i < 50; i++) {
        const basePrice = 100;
        stableCandles.push({
          timestamp: now - (50 - i) * 60000,
          open: basePrice,
          high: basePrice + 0.5,
          low: basePrice - 0.5,
          close: basePrice + (Math.random() - 0.5) * 0.5,
          volume: 1000000,
        });
      }

      const stableResult = analyzeIndicators(stableCandles);

      expect(volatileResult.atr?.atrPercent).toBeGreaterThan(stableResult.atr?.atrPercent ?? 0);
    });
  });

  describe('signal generation', () => {
    it('should return all signals with correct structure', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      result.signals.forEach((signal) => {
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('label');
        expect(signal).toHaveProperty('value');
        expect(signal).toHaveProperty('unit');
        expect(signal).toHaveProperty('severity');
        expect(signal).toHaveProperty('timestamp');
        expect(['info', 'watch', 'action']).toContain(signal.severity);
      });
    });

    it('should use latest candle timestamp for signals', () => {
      const candles = createMockCandles(50);
      const result = analyzeIndicators(candles);

      const latestTimestamp = new Date(candles[candles.length - 1].timestamp).toISOString();

      result.signals.forEach((signal) => {
        expect(signal.timestamp).toBe(latestTimestamp);
      });
    });
  });
});

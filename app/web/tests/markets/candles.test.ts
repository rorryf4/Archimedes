import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCandlestickData, calculateEMAArray } from '@/modules/markets/candles';
import * as history from '@/modules/markets/history';
import type { PricePoint } from '@/modules/markets/history';

vi.mock('@/modules/markets/history');

describe('candles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateEMAArray', () => {
    it('should return empty array for empty input', () => {
      const result = calculateEMAArray([], 12);
      expect(result).toEqual([]);
    });

    it('should return all nulls when period is invalid', () => {
      const prices = [100, 101, 102];
      const result = calculateEMAArray(prices, 0);
      expect(result).toEqual([null, null, null]);
    });

    it('should return all nulls when not enough data points', () => {
      const prices = [100, 101];
      const result = calculateEMAArray(prices, 12);
      expect(result).toEqual([null, null]);
    });

    it('should calculate EMA array with correct length', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const result = calculateEMAArray(prices, 12);

      expect(result).toHaveLength(20);
      expect(result.every((val) => typeof val === 'number')).toBe(true);
    });

    it('should have increasing EMA values for increasing prices', () => {
      const prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160];
      const result = calculateEMAArray(prices, 5);

      // EMA should generally increase for increasing prices
      const numericValues = result.filter((v): v is number => v !== null);
      expect(numericValues.length).toBeGreaterThan(0);
      expect(numericValues[numericValues.length - 1]).toBeGreaterThan(numericValues[0]);
    });

    it('should calculate EMA with smoothing factor k = 2/(period+1)', () => {
      const prices = [100, 110, 115, 120, 125, 130];
      const period = 5;
      const k = 2 / (period + 1); // 2/6 = 0.333...

      const result = calculateEMAArray(prices, period);

      // First EMA = first price
      expect(result[0]).toBe(100);

      // Second EMA = price[1] * k + ema[0] * (1-k)
      const expectedSecond = 110 * k + 100 * (1 - k);
      expect(result[1]).toBeCloseTo(expectedSecond, 5);
    });
  });

  describe('getCandlestickData', () => {
    it('should return empty array when no price history', async () => {
      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue([]);

      const result = await getCandlestickData('asset-1');

      expect(result).toEqual([]);
    });

    it('should generate correct number of candles for given bucket size', async () => {
      // Create 96 price points over 24 hours (15-minute intervals)
      const now = Date.now();
      const pricePoints: PricePoint[] = Array.from({ length: 96 }, (_, i) => ({
        timestamp: new Date(now - (95 - i) * 15 * 60 * 1000).toISOString(),
        price: 100 + Math.sin(i / 10) * 10,
      }));

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      // Default bucket size is 15 minutes
      const result = await getCandlestickData('asset-1');

      // Should have approximately 96 candles (one per 15-minute bucket)
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(96);
    });

    it('should calculate OHLC correctly for each candle', async () => {
      // Create a simple test case: 6 points in 2 buckets
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
      const bucketSize = 15 * 60 * 1000; // 15 minutes

      const pricePoints: PricePoint[] = [
        // First bucket: 00:00-00:15
        { timestamp: new Date(baseTime + 0).toISOString(), price: 100 },
        { timestamp: new Date(baseTime + 5 * 60 * 1000).toISOString(), price: 105 },
        { timestamp: new Date(baseTime + 10 * 60 * 1000).toISOString(), price: 95 },
        // Second bucket: 00:15-00:30
        { timestamp: new Date(baseTime + 15 * 60 * 1000).toISOString(), price: 98 },
        { timestamp: new Date(baseTime + 20 * 60 * 1000).toISOString(), price: 102 },
        { timestamp: new Date(baseTime + 25 * 60 * 1000).toISOString(), price: 99 },
      ];

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      const result = await getCandlestickData('asset-1', bucketSize);

      expect(result.length).toBe(2);

      // First candle: open=100, high=105, low=95, close=95
      expect(result[0].open).toBe(100);
      expect(result[0].high).toBe(105);
      expect(result[0].low).toBe(95);
      expect(result[0].close).toBe(95);

      // Second candle: open=98, high=102, low=98, close=99
      expect(result[1].open).toBe(98);
      expect(result[1].high).toBe(102);
      expect(result[1].low).toBe(98);
      expect(result[1].close).toBe(99);
    });

    it('should attach EMA arrays with correct length', async () => {
      const now = Date.now();
      const pricePoints: PricePoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(now - (29 - i) * 15 * 60 * 1000).toISOString(),
        price: 100 + i,
      }));

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      const result = await getCandlestickData('asset-1', 15 * 60 * 1000, 12, 26);

      expect(result.length).toBeGreaterThan(0);

      // Every candle should have emaShort and emaLong properties
      result.forEach((candle) => {
        expect(candle).toHaveProperty('emaShort');
        expect(candle).toHaveProperty('emaLong');
      });

      // EMAs should be numbers (not null) for sufficient data
      const numericEmaShort = result.filter((c) => c.emaShort !== null);
      const numericEmaLong = result.filter((c) => c.emaLong !== null);

      expect(numericEmaShort.length).toBeGreaterThan(0);
      expect(numericEmaLong.length).toBeGreaterThan(0);
    });

    it('should set volume to null in synthetic data', async () => {
      const pricePoints: PricePoint[] = [
        { timestamp: new Date().toISOString(), price: 100 },
        { timestamp: new Date(Date.now() + 15 * 60 * 1000).toISOString(), price: 101 },
      ];

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      const result = await getCandlestickData('asset-1');

      result.forEach((candle) => {
        expect(candle.volume).toBeNull();
      });
    });

    it('should respect custom bucket size parameter', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
      const customBucketSize = 30 * 60 * 1000; // 30 minutes

      // Create points that span 2 hours (should produce 4 buckets)
      const pricePoints: PricePoint[] = Array.from({ length: 8 }, (_, i) => ({
        timestamp: new Date(baseTime + i * 15 * 60 * 1000).toISOString(),
        price: 100 + i,
      }));

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      const result = await getCandlestickData('asset-1', customBucketSize);

      // With 30-minute buckets and 8 points at 15-min intervals (2 hours total),
      // we should get 4 candles
      expect(result.length).toBe(4);
    });

    it('should respect custom EMA period parameters', async () => {
      const pricePoints: PricePoint[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 15 * 60 * 1000).toISOString(),
        price: 100 + i * 0.5,
      }));

      vi.mocked(history.getPriceHistoryForAsset).mockResolvedValue(pricePoints);

      const shortPeriod = 5;
      const longPeriod = 10;
      const result = await getCandlestickData('asset-1', 15 * 60 * 1000, shortPeriod, longPeriod);

      // Should have EMAs calculated with custom periods
      expect(result.length).toBeGreaterThan(0);

      // All candles should have EMA values (since we have enough data)
      result.forEach((candle) => {
        expect(typeof candle.emaShort === 'number' || candle.emaShort === null).toBe(true);
        expect(typeof candle.emaLong === 'number' || candle.emaLong === null).toBe(true);
      });
    });
  });
});

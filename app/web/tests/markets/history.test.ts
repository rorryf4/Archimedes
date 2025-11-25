import { describe, it, expect } from 'vitest';
import { getPriceHistoryForAsset } from '../../modules/markets/history';

describe('getPriceHistoryForAsset', () => {
  it('should return an array of PricePoint objects', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return 96 data points (24 hours at 15-minute intervals)', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    expect(result).toHaveLength(96);
  });

  it('should return points with valid timestamp and price properties', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    for (const point of result) {
      expect(point).toHaveProperty('timestamp');
      expect(point).toHaveProperty('price');
      expect(typeof point.timestamp).toBe('string');
      expect(typeof point.price).toBe('number');
      expect(point.price).toBeGreaterThan(0);
    }
  });

  it('should return valid ISO timestamps', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    for (const point of result) {
      const date = new Date(point.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    }
  });

  it('should return timestamps in chronological order', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    for (let i = 1; i < result.length; i++) {
      const prevTime = new Date(result[i - 1].timestamp).getTime();
      const currTime = new Date(result[i].timestamp).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }
  });

  it('should return consistent results for the same asset ID', async () => {
    const result1 = await getPriceHistoryForAsset('consistent-asset');
    const result2 = await getPriceHistoryForAsset('consistent-asset');

    expect(result1.length).toBe(result2.length);

    // Prices should be the same (seeded random)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].price).toBe(result2[i].price);
    }
  });

  it('should return different results for different asset IDs', async () => {
    const result1 = await getPriceHistoryForAsset('asset-alpha');
    const result2 = await getPriceHistoryForAsset('asset-beta');

    // At least some prices should differ
    const hasDifferentPrices = result1.some(
      (point, i) => point.price !== result2[i].price
    );
    expect(hasDifferentPrices).toBe(true);
  });

  it('should return prices within a reasonable range', async () => {
    const result = await getPriceHistoryForAsset('test-asset-1');

    for (const point of result) {
      // Prices should be positive and within synthetic range
      expect(point.price).toBeGreaterThanOrEqual(0.0001);
      expect(point.price).toBeLessThan(1000000);
    }
  });
});

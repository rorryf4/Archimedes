/**
 * Candlestick chart data module
 * Generates OHLC candles with volume and EMA overlays from price history
 */

import { getPriceHistoryForAsset, type PricePoint } from './history';

export interface CandlePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  emaShort?: number | null;
  emaLong?: number | null;
}

/**
 * Calculate EMA (Exponential Moving Average) for each point in a price series
 * Returns an array of EMA values, one per input price
 */
export function calculateEMAArray(prices: number[], period: number): (number | null)[] {
  if (prices.length === 0) return [];
  if (period <= 0) return prices.map(() => null);
  if (prices.length < period) return prices.map(() => null);

  const k = 2 / (period + 1); // Smoothing factor
  const emas: (number | null)[] = [];

  let ema = prices[0];
  emas.push(ema);

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emas.push(ema);
  }

  return emas;
}

/**
 * Bucket price points into candlesticks
 * @param points - Array of price points (must be sorted by timestamp ascending)
 * @param bucketSizeMs - Size of each candle bucket in milliseconds
 */
function bucketIntoCandlesticks(
  points: PricePoint[],
  bucketSizeMs: number
): CandlePoint[] {
  if (points.length === 0) return [];

  const candles: CandlePoint[] = [];
  let currentBucket: PricePoint[] = [];
  let bucketStartTime: number | null = null;

  for (const point of points) {
    const pointTime = new Date(point.timestamp).getTime();

    // Determine which bucket this point belongs to
    if (bucketStartTime === null) {
      // First point - start a new bucket
      bucketStartTime = Math.floor(pointTime / bucketSizeMs) * bucketSizeMs;
    }

    const pointBucketStart = Math.floor(pointTime / bucketSizeMs) * bucketSizeMs;

    if (pointBucketStart === bucketStartTime) {
      // Same bucket - add to current
      currentBucket.push(point);
    } else {
      // New bucket - finalize previous and start new
      if (currentBucket.length > 0) {
        candles.push(createCandleFromBucket(currentBucket, bucketStartTime));
      }
      currentBucket = [point];
      bucketStartTime = pointBucketStart;
    }
  }

  // Finalize last bucket
  if (currentBucket.length > 0 && bucketStartTime !== null) {
    candles.push(createCandleFromBucket(currentBucket, bucketStartTime));
  }

  return candles;
}

/**
 * Create a single candle from a bucket of price points
 */
function createCandleFromBucket(bucket: PricePoint[], timestamp: number): CandlePoint {
  const prices = bucket.map((p) => p.price);

  return {
    timestamp,
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    volume: null, // Volume not yet available in synthetic data
    emaShort: null, // Will be filled later
    emaLong: null, // Will be filled later
  };
}

/**
 * Generate candlestick chart data with EMA overlays
 * @param assetId - Asset ID to generate candles for
 * @param bucketSizeMs - Candle bucket size in milliseconds (default: 15 min)
 * @param emaShortPeriod - Short EMA period (default: 12)
 * @param emaLongPeriod - Long EMA period (default: 26)
 */
export async function getCandlestickData(
  assetId: string,
  bucketSizeMs: number = 15 * 60 * 1000, // 15 minutes
  emaShortPeriod: number = 12,
  emaLongPeriod: number = 26
): Promise<CandlePoint[]> {
  // Get raw price history
  const history = await getPriceHistoryForAsset(assetId);

  if (history.length === 0) {
    return [];
  }

  // Bucket into candlesticks
  const candles = bucketIntoCandlesticks(history, bucketSizeMs);

  if (candles.length === 0) {
    return [];
  }

  // Calculate EMAs based on close prices
  const closePrices = candles.map((c) => c.close);
  const emaShortArray = calculateEMAArray(closePrices, emaShortPeriod);
  const emaLongArray = calculateEMAArray(closePrices, emaLongPeriod);

  // Attach EMAs to candles
  return candles.map((candle, i) => ({
    ...candle,
    emaShort: emaShortArray[i],
    emaLong: emaLongArray[i],
  }));
}

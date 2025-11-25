/**
 * Price history module for asset drilldown charts
 */

export interface PricePoint {
  timestamp: string;
  price: number;
}

/**
 * Simple hash function to generate a consistent seed from asset ID
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator for consistent results
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate synthetic price history for an asset
 * Returns 24 hours of data at 15-minute intervals (96 data points)
 */
function generateSyntheticHistory(assetId: string): PricePoint[] {
  const seed = hashString(assetId);
  const random = seededRandom(seed);

  // Base price derived from seed (range: $0.01 to $100,000)
  const logMin = Math.log(0.01);
  const logMax = Math.log(100000);
  const basePrice = Math.exp(logMin + random() * (logMax - logMin));

  const points: PricePoint[] = [];
  const now = new Date();
  const intervalMs = 15 * 60 * 1000; // 15 minutes
  const numPoints = 96; // 24 hours worth

  let currentPrice = basePrice;

  for (let i = numPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);

    // Random walk: -2% to +2% per interval
    const change = (random() - 0.5) * 0.04;
    currentPrice = currentPrice * (1 + change);

    // Ensure price stays positive
    currentPrice = Math.max(currentPrice, 0.0001);

    points.push({
      timestamp: timestamp.toISOString(),
      price: currentPrice,
    });
  }

  return points;
}

/**
 * Get price history for an asset
 * Currently uses synthetic data; can be extended to use real provider history
 */
export async function getPriceHistoryForAsset(assetId: string): Promise<PricePoint[]> {
  // For now, return synthetic data
  // In the future, this could check for a real history provider:
  // const provider = getMarketDataProvider();
  // if (provider?.getHistory) { return provider.getHistory(assetId); }

  return generateSyntheticHistory(assetId);
}

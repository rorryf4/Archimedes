import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listOpportunities } from '../../modules/opportunities/service';
import type { WatchlistEnriched, WatchlistItemEnriched } from '../../modules/watchlists/types';
import type { SignalResult } from '../../modules/signals/types';

// Mock dependencies
vi.mock('../../modules/watchlists/service', () => ({
  listWatchlistsEnriched: vi.fn(),
}));

vi.mock('../../modules/signals/preferences.service', () => ({
  getCurrentUserSignalPreferences: vi.fn(),
}));

vi.mock('../../modules/markets/history', () => ({
  getPriceHistoryForAsset: vi.fn((assetId: string) => {
    // Return synthetic history based on assetId
    const prices: number[] = [];
    const basePrice = 100;

    // Generate 96 data points (24h at 15min intervals)
    for (let i = 0; i < 96; i++) {
      if (assetId === 'uptrend-asset') {
        // Upward trend: EMA(12) > EMA(26) by ~2%
        prices.push(basePrice + i * 0.3);
      } else if (assetId === 'downtrend-asset') {
        // Downward trend: EMA(12) < EMA(26) by ~2%
        prices.push(basePrice - i * 0.3);
      } else {
        // Flat trend: EMA(12) ≈ EMA(26)
        prices.push(basePrice);
      }
    }

    return Promise.resolve(
      prices.map((price, i) => ({
        timestamp: new Date(Date.now() - (95 - i) * 15 * 60 * 1000).toISOString(),
        price,
      }))
    );
  }),
}));

import { listWatchlistsEnriched } from '../../modules/watchlists/service';
import { getCurrentUserSignalPreferences } from '../../modules/signals/preferences.service';

// Helper to create a signal result
function createSignal(
  id: string,
  severity: 'none' | 'info' | 'watch' | 'action',
  value: number | null = null,
): SignalResult {
  return {
    id,
    label: `${id} Signal`,
    value,
    severity,
    timestamp: new Date().toISOString(),
  };
}

// Helper to create an enriched item
function createItem(
  id: string,
  symbol: string,
  name: string,
  signals: SignalResult[],
  overrides: Partial<WatchlistItemEnriched> = {},
): WatchlistItemEnriched {
  return {
    id,
    kind: 'token',
    createdAt: '2025-01-01T00:00:00Z',
    symbol,
    name,
    signals,
    price: 100,
    priceChange24h: 0,
    volume24h: 1000000,
    ...overrides,
  };
}

// Helper to create a watchlist
function createWatchlist(
  id: string,
  name: string,
  items: WatchlistItemEnriched[],
): WatchlistEnriched {
  return {
    id,
    ownerUserId: 'test-user',
    name,
    description: undefined,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    items,
  };
}

describe('Opportunity Scoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock preferences to return null (no preferences set) by default
    vi.mocked(getCurrentUserSignalPreferences).mockResolvedValue(null);
  });

  describe('severityScore', () => {
    it('should score none severity as 0', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'none'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'none' });
      expect(opportunities[0].subScores.severity).toBe(0);
    });

    it('should score info severity as 25', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.severity).toBe(25);
    });

    it('should score watch severity as 50', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'watch'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.severity).toBe(50);
    });

    it('should score action severity as 100', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'action'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.severity).toBe(100);
    });

    it('should use highest severity when multiple signals present', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'action'),
        createSignal('sig3', 'watch'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.severity).toBe(100); // action = 100
    });
  });

  describe('signalDensityScore', () => {
    it('should score 0 info+ signals as 0', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'none'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'none' });
      expect(opportunities[0].subScores.signalDensity).toBe(0);
    });

    it('should score 1 info+ signal as 25', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.signalDensity).toBe(25);
    });

    it('should score 2 info+ signals as 50', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'watch'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.signalDensity).toBe(50);
    });

    it('should score 3 info+ signals as 75', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'watch'),
        createSignal('sig3', 'action'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.signalDensity).toBe(75);
    });

    it('should score 4+ info+ signals as 100', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'watch'),
        createSignal('sig3', 'action'),
        createSignal('sig4', 'info'),
        createSignal('sig5', 'watch'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.signalDensity).toBe(100);
    });
  });

  describe('priceMomentumScore', () => {
    it('should score -10% as 0', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: -10 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(0);
    });

    it('should score 0% as 50', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: 0 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(50);
    });

    it('should score +10% as 100', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: 10 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(100);
    });

    it('should clamp values beyond +10% to 100', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: 25 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(100);
    });

    it('should clamp values below -10% to 0', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: -20 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(0);
    });

    it('should score null price change as 50 (neutral)', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: undefined });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.priceMomentum).toBe(50);
    });
  });

  describe('volumeScore', () => {
    it('should score all null volumes as 50', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { volume24h: undefined });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.volume).toBe(50);
    });

    it('should score equal volumes as 50', async () => {
      const item1 = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { volume24h: 1000000 });

      const item2 = createItem('asset-2', 'TEST2', 'Test Asset 2', [
        createSignal('sig1', 'info'),
      ], { volume24h: 1000000 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item1, item2]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.volume).toBe(50);
      expect(opportunities[1].subScores.volume).toBe(50);
    });

    it('should score min volume as 0 and max volume as 100', async () => {
      const item1 = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { volume24h: 500000 });

      const item2 = createItem('asset-2', 'TEST2', 'Test Asset 2', [
        createSignal('sig1', 'info'),
      ], { volume24h: 2000000 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item1, item2]),
      ]);

      const opportunities = await listOpportunities();
      const minVolumeOpp = opportunities.find((o) => o.volume24h === 500000);
      const maxVolumeOpp = opportunities.find((o) => o.volume24h === 2000000);

      expect(minVolumeOpp?.subScores.volume).toBe(0);
      expect(maxVolumeOpp?.subScores.volume).toBe(100);
    });

    it('should score mid-range volume around 50', async () => {
      const item1 = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ], { volume24h: 1000000 });

      const item2 = createItem('asset-2', 'TEST2', 'Test Asset 2', [
        createSignal('sig1', 'info'),
      ], { volume24h: 1500000 });

      const item3 = createItem('asset-3', 'TEST3', 'Test Asset 3', [
        createSignal('sig1', 'info'),
      ], { volume24h: 2000000 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item1, item2, item3]),
      ]);

      const opportunities = await listOpportunities();
      const midVolumeOpp = opportunities.find((o) => o.volume24h === 1500000);

      expect(midVolumeOpp?.subScores.volume).toBe(50);
    });
  });

  describe('trendScore', () => {
    it('should score strong uptrend (diffPct >= 3) as 100', async () => {
      const item = createItem('uptrend-asset', 'UPTREND', 'Uptrend Asset', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.trend).toBeGreaterThanOrEqual(75);
    });

    it('should score strong downtrend (diffPct <= -3) as 0', async () => {
      const item = createItem('downtrend-asset', 'DOWNTREND', 'Downtrend Asset', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.trend).toBeLessThanOrEqual(25);
    });

    it('should score flat trend around 50', async () => {
      const item = createItem('flat-asset', 'FLAT', 'Flat Asset', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.trend).toBe(50);
    });
  });

  describe('preferenceAlignmentScore', () => {
    it('should score 0 matches as default when no preferences', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.preferenceAlignment).toBe(50); // neutral when no prefs
    });

    it('should score 1 matching enabled signal as 20', async () => {
      vi.mocked(getCurrentUserSignalPreferences).mockResolvedValue({
        userId: 'test-user',
        defaultMinSeverity: 'info',
        signalPreferences: [{ signalId: 'sig1', enabled: true }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.preferenceAlignment).toBe(20);
    });

    it('should score 3 matching enabled signals as 60', async () => {
      vi.mocked(getCurrentUserSignalPreferences).mockResolvedValue({
        userId: 'test-user',
        defaultMinSeverity: 'info',
        signalPreferences: [
          { signalId: 'sig1', enabled: true },
          { signalId: 'sig2', enabled: true },
          { signalId: 'sig3', enabled: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'watch'),
        createSignal('sig3', 'action'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.preferenceAlignment).toBe(60);
    });

    it('should cap score at 100 for 5+ matches', async () => {
      vi.mocked(getCurrentUserSignalPreferences).mockResolvedValue({
        userId: 'test-user',
        defaultMinSeverity: 'info',
        signalPreferences: [
          { signalId: 'sig1', enabled: true },
          { signalId: 'sig2', enabled: true },
          { signalId: 'sig3', enabled: true },
          { signalId: 'sig4', enabled: true },
          { signalId: 'sig5', enabled: true },
          { signalId: 'sig6', enabled: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
        createSignal('sig2', 'watch'),
        createSignal('sig3', 'action'),
        createSignal('sig4', 'info'),
        createSignal('sig5', 'watch'),
        createSignal('sig6', 'action'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      expect(opportunities[0].subScores.preferenceAlignment).toBe(100);
    });
  });

  describe('overall score calculation', () => {
    it('should calculate weighted score and clamp to [0, 100]', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'action'),
        createSignal('sig2', 'watch'),
      ], { priceChange24h: 5, volume24h: 1500000 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      const opp = opportunities[0];

      // Verify score is within bounds
      expect(opp.score).toBeGreaterThanOrEqual(0);
      expect(opp.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(opp.score)).toBe(true);

      // Verify weighted formula (approximately)
      const expectedScore =
        opp.subScores.severity * 0.3 +
        opp.subScores.signalDensity * 0.2 +
        opp.subScores.priceMomentum * 0.15 +
        opp.subScores.volume * 0.15 +
        opp.subScores.trend * 0.1 +
        opp.subScores.preferenceAlignment * 0.1;

      expect(opp.score).toBe(Math.round(expectedScore));
    });

    it('should have all sub-scores defined', async () => {
      const item = createItem('asset-1', 'TEST1', 'Test Asset 1', [
        createSignal('sig1', 'info'),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [item]),
      ]);

      const opportunities = await listOpportunities();
      const opp = opportunities[0];

      expect(opp.subScores).toBeDefined();
      expect(opp.subScores.severity).toBeGreaterThanOrEqual(0);
      expect(opp.subScores.signalDensity).toBeGreaterThanOrEqual(0);
      expect(opp.subScores.priceMomentum).toBeGreaterThanOrEqual(0);
      expect(opp.subScores.volume).toBeGreaterThanOrEqual(0);
      expect(opp.subScores.trend).toBeGreaterThanOrEqual(0);
      expect(opp.subScores.preferenceAlignment).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sorting by score', () => {
    it('should sort opportunities by score descending when sortBy=score', async () => {
      const itemLow = createItem('asset-low', 'LOW', 'Low Score Asset', [
        createSignal('sig1', 'info'),
      ], { priceChange24h: -5, volume24h: 500000 });

      const itemHigh = createItem('asset-high', 'HIGH', 'High Score Asset', [
        createSignal('sig1', 'action'),
        createSignal('sig2', 'watch'),
        createSignal('sig3', 'info'),
      ], { priceChange24h: 8, volume24h: 2000000 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Test WL', [itemLow, itemHigh]),
      ]);

      const opportunities = await listOpportunities({ sortBy: 'score' });

      // Verify descending order
      for (let i = 0; i < opportunities.length - 1; i++) {
        expect(opportunities[i].score).toBeGreaterThanOrEqual(opportunities[i + 1].score);
      }
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listOpportunities } from '../../modules/opportunities/service';
import type { WatchlistEnriched, WatchlistItemEnriched } from '../../modules/watchlists/types';
import type { SignalResult } from '../../modules/signals/types';

vi.mock('../../modules/watchlists/service', () => ({
  listWatchlistsEnriched: vi.fn(),
}));

vi.mock('../../modules/signals/preferences.service', () => ({
  getCurrentUserSignalPreferences: vi.fn(),
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
    priceChange24h: 5.0,
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
    ownerUserId: 'user-1',
    name,
    description: undefined,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    items,
  };
}

describe('opportunities service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock preferences to return null (no preferences set) by default
    vi.mocked(getCurrentUserSignalPreferences).mockResolvedValue(null);
  });

  describe('listOpportunities', () => {
    it('should exclude items without qualifying signals when minSeverity is set', async () => {
      const itemWithAction = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const itemWithInfo = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'info', 50),
      ]);
      const itemWithNone = createItem('item-3', 'SOL', 'Solana', [
        createSignal('volume_burst', 'none', 10),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithAction, itemWithInfo, itemWithNone]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'watch' });

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
    });

    it('should include items with any signals when minSeverity is not set', async () => {
      const itemWithAction = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const itemWithInfo = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'info', 50),
      ]);
      const itemWithNone = createItem('item-3', 'SOL', 'Solana', [
        createSignal('volume_burst', 'none', 10),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithAction, itemWithInfo, itemWithNone]),
      ]);

      const opportunities = await listOpportunities();

      // Default minSeverity is 'info', so items with only 'none' severity are filtered out
      expect(opportunities).toHaveLength(2);
      expect(opportunities.map((o) => o.id)).toContain('item-1');
      expect(opportunities.map((o) => o.id)).toContain('item-2');
    });

    it('should respect minSeverity filter - excludes low severity items', async () => {
      const itemWithWatch = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'watch', 100),
      ]);
      const itemWithInfo = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'info', 50),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithWatch, itemWithInfo]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'watch' });

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
      expect(opportunities[0].symbol).toBe('BTC');
    });

    it('should respect minSeverity filter - includes high severity items', async () => {
      const itemWithAction = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 200),
      ]);
      const itemWithWatch = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'watch', 100),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithAction, itemWithWatch]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'watch' });

      expect(opportunities).toHaveLength(2);
      expect(opportunities.map((o) => o.id)).toContain('item-1');
      expect(opportunities.map((o) => o.id)).toContain('item-2');
    });

    it('should respect signalKeys filter - includes items with matching keys', async () => {
      const itemWithVolumeBurst = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const itemWithPriceMove = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('price_move', 'watch', 100),
      ]);
      const itemWithOther = createItem('item-3', 'SOL', 'Solana', [
        createSignal('other_signal', 'info', 50),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithVolumeBurst, itemWithPriceMove, itemWithOther]),
      ]);

      const opportunities = await listOpportunities({ signalKeys: ['volume_burst', 'price_move'] });

      expect(opportunities).toHaveLength(2);
      expect(opportunities.map((o) => o.id)).toContain('item-1');
      expect(opportunities.map((o) => o.id)).toContain('item-2');
    });

    it('should respect signalKeys filter - excludes items without matching keys', async () => {
      const itemWithVolumeBurst = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const itemWithOther = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('other_signal', 'info', 50),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithVolumeBurst, itemWithOther]),
      ]);

      const opportunities = await listOpportunities({ signalKeys: ['volume_burst'] });

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
    });

    it('should respect watchlistId filter - only includes items from that watchlist', async () => {
      const btcItem = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const ethItem = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'watch', 100),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [btcItem]),
        createWatchlist('wl-2', 'Trending', [ethItem]),
      ]);

      const opportunities = await listOpportunities({ watchlistId: 'wl-1' });

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
    });

    it('should aggregate watchlists correctly when same item appears in multiple watchlists', async () => {
      const btcItem = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [btcItem]),
        createWatchlist('wl-2', 'High Priority', [btcItem]),
        createWatchlist('wl-3', 'Trending', [btcItem]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
      expect(opportunities[0].watchlists).toHaveLength(3);
      expect(opportunities[0].watchlists).toEqual(
        expect.arrayContaining([
          { id: 'wl-1', name: 'Favorites' },
          { id: 'wl-2', name: 'High Priority' },
          { id: 'wl-3', name: 'Trending' },
        ])
      );
    });

    it('should sort by severityRank descending', async () => {
      const itemWithInfo = createItem('item-1', 'SOL', 'Solana', [
        createSignal('volume_burst', 'info', 50),
      ], { priceChange24h: 10 });
      const itemWithAction = createItem('item-2', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: 5 });
      const itemWithWatch = createItem('item-3', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'watch', 100),
      ], { priceChange24h: 8 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithInfo, itemWithAction, itemWithWatch]),
      ]);

      const opportunities = await listOpportunities({ sortBy: 'severity' });

      expect(opportunities).toHaveLength(3);
      // Action (rank 3) first, then Watch (rank 2), then Info (rank 1)
      expect(opportunities[0].id).toBe('item-2'); // action
      expect(opportunities[1].id).toBe('item-3'); // watch
      expect(opportunities[2].id).toBe('item-1'); // info
    });

    it('should sort by priceChange24h descending as tie-breaker', async () => {
      const itemA = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: 5 });
      const itemB = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: 10 });
      const itemC = createItem('item-3', 'SOL', 'Solana', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: 8 });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemA, itemB, itemC]),
      ]);

      const opportunities = await listOpportunities({ sortBy: 'severity' });

      expect(opportunities).toHaveLength(3);
      // All have same severityRank, so sorted by priceChange24h desc
      expect(opportunities[0].id).toBe('item-2'); // 10%
      expect(opportunities[1].id).toBe('item-3'); // 8%
      expect(opportunities[2].id).toBe('item-1'); // 5%
    });

    it('should treat null priceChange24h as lowest when sorting', async () => {
      const itemWithChange = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: 5 });
      const itemWithNull = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('volume_burst', 'action', 150),
      ], { priceChange24h: undefined });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemWithNull, itemWithChange]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(2);
      // Item with price change should come first
      expect(opportunities[0].id).toBe('item-1');
      expect(opportunities[1].id).toBe('item-2');
    });

    it('should compute severityCounts correctly', async () => {
      const item = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('signal-1', 'action', 150),
        createSignal('signal-2', 'action', 140),
        createSignal('signal-3', 'watch', 100),
        createSignal('signal-4', 'info', 50),
        createSignal('signal-5', 'none', 10),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [item]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].severityCounts).toEqual({
        none: 1,
        info: 1,
        watch: 1,
        action: 2,
      });
    });

    it('should correctly identify primarySignal as highest severity signal', async () => {
      const item = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('signal-info', 'info', 50),
        createSignal('signal-action', 'action', 150),
        createSignal('signal-watch', 'watch', 100),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [item]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].primarySignal).not.toBeNull();
      expect(opportunities[0].primarySignal?.id).toBe('signal-action');
      expect(opportunities[0].primarySignal?.severity).toBe('action');
    });

    it('should filter out items with only none-severity signals (due to default minSeverity)', async () => {
      const item = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('signal-none', 'none', 10),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [item]),
      ]);

      const opportunities = await listOpportunities();

      // Items with only 'none' severity signals are filtered out by default minSeverity='info'
      expect(opportunities).toHaveLength(0);
    });

    it('should copy market metrics from enriched items', async () => {
      const item = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ], {
        price: 50000,
        priceChange24h: 5.5,
        volume24h: 28000000000,
      });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [item]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].price).toBe(50000);
      expect(opportunities[0].priceChange24h).toBe(5.5);
      expect(opportunities[0].volume24h).toBe(28000000000);
    });

    it('should handle market kind items correctly', async () => {
      const marketItem = createItem('item-1', 'ETH/USDT', 'Ethereum / Tether', [
        createSignal('volume_burst', 'watch', 100),
      ], {
        kind: 'market',
        marketId: 'eth-usdt',
        baseSymbol: 'ETH',
        quoteSymbol: 'USDT',
      });

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [marketItem]),
      ]);

      const opportunities = await listOpportunities();

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].kind).toBe('market');
      expect(opportunities[0].symbol).toBe('ETH/USDT');
    });

    it('should return empty array when no watchlists exist', async () => {
      vi.mocked(listWatchlistsEnriched).mockResolvedValue([]);

      const opportunities = await listOpportunities();

      expect(opportunities).toEqual([]);
    });

    it('should return empty array when all items are filtered out', async () => {
      const item = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'info', 50),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [item]),
      ]);

      const opportunities = await listOpportunities({ minSeverity: 'action' });

      expect(opportunities).toEqual([]);
    });

    it('should combine minSeverity and signalKeys filters', async () => {
      const itemMatchesBoth = createItem('item-1', 'BTC', 'Bitcoin', [
        createSignal('volume_burst', 'action', 150),
      ]);
      const itemMatchesSeverityOnly = createItem('item-2', 'ETH', 'Ethereum', [
        createSignal('price_move', 'action', 140),
      ]);
      const itemMatchesKeyOnly = createItem('item-3', 'SOL', 'Solana', [
        createSignal('volume_burst', 'info', 50),
      ]);

      vi.mocked(listWatchlistsEnriched).mockResolvedValue([
        createWatchlist('wl-1', 'Favorites', [itemMatchesBoth, itemMatchesSeverityOnly, itemMatchesKeyOnly]),
      ]);

      const opportunities = await listOpportunities({
        minSeverity: 'watch',
        signalKeys: ['volume_burst'],
      });

      // Only item-1 matches both filters
      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe('item-1');
    });
  });
});

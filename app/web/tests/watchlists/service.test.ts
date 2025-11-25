import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  MarketDataProvider,
  MarketQuery,
  MarketSnapshot,
} from '../../modules/markets/marketData';
import {
  listWatchlists,
  getWatchlistById,
  listWatchlistsWithRelations,
  getWatchlistWithRelationsById,
  listWatchlistsEnriched,
  getWatchlistEnriched,
} from '../../modules/watchlists/service';

// Mock the market data provider for enriched API tests
let mockProvider: MarketDataProvider;

vi.mock('../../modules/markets/marketData', () => ({
  getMarketDataProvider: () => mockProvider,
}));

describe('watchlists service', () => {
  beforeEach(() => {
    // Reset the mock provider before each test
    mockProvider = {
      getSnapshot: vi.fn(() => Promise.resolve(null)),
      getSnapshots: vi.fn((queries: MarketQuery[]) => {
        const map = new Map<string, MarketSnapshot | null>();
        // Use same key logic as enrichment.ts: 'token:<token>' or 'market:<market>'
        for (const q of queries) {
          const key = q.kind === 'token' ? `token:${q.token}` : `market:${q.market}`;
          // Return deterministic test data based on the key
          if (key === 'token:btc') {
            map.set(key, {
              price: 50000,
              change24hPct: 5.2,
              volume24h: 28_000_000_000,
              lastUpdated: '2025-01-15T12:00:00Z',
              source: 'test',
            });
          } else if (key === 'market:btc-usdt') {
            map.set(key, {
              price: 50_100,
              change24hPct: 5.5,
              volume24h: 15_000_000_000,
              lastUpdated: '2025-01-15T12:00:00Z',
              source: 'test',
            });
          } else if (key === 'token:eth') {
            map.set(key, {
              price: 3_000,
              change24hPct: 3.1,
              volume24h: 12_000_000_000,
              lastUpdated: '2025-01-15T12:00:00Z',
              source: 'test',
            });
          } else if (key === 'market:eth-usdt') {
            map.set(key, {
              price: 3_020,
              change24hPct: 3.3,
              volume24h: 8_000_000_000,
              lastUpdated: '2025-01-15T12:00:00Z',
              source: 'test',
            });
          } else if (key === 'token:usdt') {
            map.set(key, {
              price: 1.0,
              change24hPct: 0.01,
              volume24h: 45_000_000_000,
              lastUpdated: '2025-01-15T12:00:00Z',
              source: 'test',
            });
          } else {
            // Unknown tokens/markets get null
            map.set(key, null);
          }
        }
        return Promise.resolve(map);
      }),
    };
  });

  // ==========================================================================
  // RAW SYNC API: listWatchlists / getWatchlistById
  // These return raw Watchlist[] without enrichment
  // ==========================================================================

  describe('listWatchlists (raw sync)', () => {
    it('should return an array of raw watchlists', () => {
      const watchlists = listWatchlists();
      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBe(2);
    });

    it('should return watchlists with correct structure', () => {
      const watchlists = listWatchlists();
      const first = watchlists[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('ownerUserId');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('createdAt');
      expect(first).toHaveProperty('updatedAt');
      expect(first).toHaveProperty('items');
      expect(Array.isArray(first.items)).toBe(true);
    });

    it('should return raw items without enrichment', () => {
      const watchlists = listWatchlists();
      const first = watchlists[0];

      expect(first.id).toBe('wl-favorites');
      expect(first.items.length).toBe(3);

      // Raw items have tokenId/marketId but NOT enriched fields like kind, symbol, price
      const btcItem = first.items[0];
      expect(btcItem.id).toBe('wli-1');
      expect(btcItem.tokenId).toBe('btc');
      expect(btcItem).toHaveProperty('createdAt');

      // Raw items should NOT have enriched properties
      expect('kind' in btcItem).toBe(false);
      expect('symbol' in btcItem).toBe(false);
      expect('price' in btcItem).toBe(false);
    });

    it('should NOT call market data provider', () => {
      listWatchlists();
      // Raw API does not fetch market data
      expect(mockProvider.getSnapshots).not.toHaveBeenCalled();
    });
  });

  describe('getWatchlistById (raw sync)', () => {
    it('should return raw watchlist when ID exists', () => {
      const watchlist = getWatchlistById('wl-favorites');

      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe('wl-favorites');
      expect(watchlist?.name).toBe('My Favorites');
      expect(watchlist?.items.length).toBe(3);
    });

    it('should return undefined when ID does not exist', () => {
      const watchlist = getWatchlistById('non-existent-id');
      expect(watchlist).toBeUndefined();
    });

    it('should return raw items without enrichment', () => {
      const watchlist = getWatchlistById('wl-favorites');

      expect(watchlist).toBeDefined();

      const btcItem = watchlist?.items[0];
      expect(btcItem?.id).toBe('wli-1');
      expect(btcItem?.tokenId).toBe('btc');

      // Raw items should NOT have enriched properties
      expect('kind' in (btcItem ?? {})).toBe(false);
      expect('symbol' in (btcItem ?? {})).toBe(false);
      expect('price' in (btcItem ?? {})).toBe(false);
    });

    it('should maintain item order', () => {
      const watchlist = getWatchlistById('wl-favorites');

      const ids = watchlist?.items.map((item) => item.id);
      expect(ids).toEqual(['wli-1', 'wli-2', 'wli-3']);
    });

    it('should NOT call market data provider', () => {
      getWatchlistById('wl-favorites');
      expect(mockProvider.getSnapshots).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RELATIONS API: listWatchlistsWithRelations / getWatchlistWithRelationsById
  // These return WatchlistWithRelations[] with nested token/market objects
  // ==========================================================================

  describe('listWatchlistsWithRelations', () => {
    it('should return watchlists with relations', () => {
      const watchlists = listWatchlistsWithRelations();

      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBe(2);

      const first = watchlists[0];
      expect(first.id).toBe('wl-favorites');
      expect(first.items.length).toBe(3);
    });

    it('should include nested token objects for token items', () => {
      const watchlists = listWatchlistsWithRelations();
      const first = watchlists[0];

      // First item is a token (BTC)
      const btcItem = first.items[0];
      expect(btcItem.id).toBe('wli-1');
      expect(btcItem.token).toBeDefined();
      expect(btcItem.token?.id).toBe('btc');
      expect(btcItem.token?.symbol).toBe('BTC');
      expect(btcItem.token?.name).toBe('Bitcoin');
      expect(btcItem.market).toBeUndefined();
    });

    it('should include nested market objects for market items', () => {
      const watchlists = listWatchlistsWithRelations();
      const first = watchlists[0];

      // Second item is a market (BTC-USDT)
      const marketItem = first.items[1];
      expect(marketItem.id).toBe('wli-2');
      expect(marketItem.market).toBeDefined();
      expect(marketItem.market?.id).toBe('btc-usdt');
      expect(marketItem.market?.baseToken.symbol).toBe('BTC');
      expect(marketItem.market?.quoteToken.symbol).toBe('USDT');
      expect(marketItem.token).toBeUndefined();
    });

    it('should preserve watchlist metadata', () => {
      const watchlists = listWatchlistsWithRelations();

      const favorites = watchlists.find((wl) => wl.id === 'wl-favorites');
      expect(favorites?.name).toBe('My Favorites');
      expect(favorites?.description).toBe('My favorite cryptocurrencies and markets');
      expect(favorites?.ownerUserId).toBe('user-test-default');
      expect(favorites?.createdAt).toBe('2025-01-10T09:00:00Z');
      expect(favorites?.updatedAt).toBe('2025-01-10T10:10:00Z');

      const trending = watchlists.find((wl) => wl.id === 'wl-trending');
      expect(trending?.name).toBe('Trending Markets');
      expect(trending?.description).toBe('Currently trending cryptocurrency markets');
    });
  });

  describe('getWatchlistWithRelationsById', () => {
    it('should return watchlist with relations when ID exists', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');

      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe('wl-favorites');
      expect(watchlist?.name).toBe('My Favorites');
    });

    it('should return undefined when ID does not exist', () => {
      const watchlist = getWatchlistWithRelationsById('non-existent-id');
      expect(watchlist).toBeUndefined();
    });

    it('should include nested token objects', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');

      const tokenItem = watchlist?.items.find((item) => item.token?.id === 'btc');
      expect(tokenItem).toBeDefined();
      expect(tokenItem?.token?.symbol).toBe('BTC');
      expect(tokenItem?.token?.name).toBe('Bitcoin');
    });

    it('should include nested market objects', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');

      const marketItem = watchlist?.items.find((item) => item.market?.id === 'btc-usdt');
      expect(marketItem).toBeDefined();
      expect(marketItem?.market?.baseToken.symbol).toBe('BTC');
      expect(marketItem?.market?.quoteToken.symbol).toBe('USDT');
    });

    it('should maintain item order', () => {
      const watchlist = getWatchlistWithRelationsById('wl-trending');

      expect(watchlist?.id).toBe('wl-trending');
      expect(watchlist?.name).toBe('Trending Markets');

      const ids = watchlist?.items.map((item) => item.id);
      expect(ids).toEqual(['wli-4', 'wli-5']);
    });

    it('should work with different watchlists', () => {
      const trending = getWatchlistWithRelationsById('wl-trending');

      expect(trending).toBeDefined();
      expect(trending?.items.length).toBe(2);

      // Check ETH-USDT market item
      const ethUsdtItem = trending?.items.find((item) => item.market?.id === 'eth-usdt');
      expect(ethUsdtItem?.market?.baseToken.symbol).toBe('ETH');
      expect(ethUsdtItem?.market?.quoteToken.symbol).toBe('USDT');

      // Check USDT token item
      const usdtItem = trending?.items.find((item) => item.token?.id === 'usdt');
      expect(usdtItem?.token?.symbol).toBe('USDT');
    });
  });

  // ==========================================================================
  // ENRICHED ASYNC API: listWatchlistsEnriched / getWatchlistEnriched
  // These return enriched data with market prices and signals
  // ==========================================================================

  describe('listWatchlistsEnriched (async)', () => {
    it('should return a promise that resolves to enriched watchlists', async () => {
      const watchlists = await listWatchlistsEnriched();

      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBe(2);
    });

    it('should enrich watchlist items with market data', async () => {
      const watchlists = await listWatchlistsEnriched();
      const first = watchlists[0];

      expect(first.id).toBe('wl-favorites');
      expect(first.items.length).toBe(3);

      // Check first item (BTC token)
      const btcItem = first.items[0];
      expect(btcItem.id).toBe('wli-1');
      expect(btcItem.kind).toBe('token');
      expect(btcItem.tokenId).toBe('btc');
      expect(btcItem.symbol).toBe('BTC');
      expect(btcItem.name).toBe('Bitcoin');
      expect(btcItem.price).toBe(50000);
      expect(btcItem.priceChange24h).toBe(5.2);
      expect(btcItem.volume24h).toBe(28_000_000_000);

      // Check second item (BTC-USDT market)
      const btcUsdtItem = first.items[1];
      expect(btcUsdtItem.id).toBe('wli-2');
      expect(btcUsdtItem.kind).toBe('market');
      expect(btcUsdtItem.marketId).toBe('btc-usdt');
      expect(btcUsdtItem.symbol).toBe('BTC/USDT');
      expect(btcUsdtItem.name).toBe('Bitcoin / Tether USD');
      expect(btcUsdtItem.baseSymbol).toBe('BTC');
      expect(btcUsdtItem.quoteSymbol).toBe('USDT');
      expect(btcUsdtItem.price).toBe(50_100);
      expect(btcUsdtItem.priceChange24h).toBe(5.5);
      expect(btcUsdtItem.volume24h).toBe(15_000_000_000);

      // Check third item (ETH token)
      const ethItem = first.items[2];
      expect(ethItem.id).toBe('wli-3');
      expect(ethItem.kind).toBe('token');
      expect(ethItem.tokenId).toBe('eth');
      expect(ethItem.symbol).toBe('ETH');
      expect(ethItem.name).toBe('Ethereum');
      expect(ethItem.price).toBe(3_000);
      expect(ethItem.priceChange24h).toBe(3.1);
      expect(ethItem.volume24h).toBe(12_000_000_000);
    });

    it('should include real signals array', async () => {
      const watchlists = await listWatchlistsEnriched();
      const first = watchlists[0];

      first.items.forEach((item) => {
        expect(Array.isArray(item.signals)).toBe(true);
      });
    });

    it('should call market data provider', async () => {
      await listWatchlistsEnriched();

      // Should call getSnapshots for each watchlist
      expect(mockProvider.getSnapshots).toHaveBeenCalled();
    });
  });

  describe('getWatchlistEnriched (async)', () => {
    it('should return a promise that resolves to enriched watchlist', async () => {
      const watchlist = await getWatchlistEnriched('wl-favorites');

      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe('wl-favorites');
      expect(watchlist?.name).toBe('My Favorites');
      expect(watchlist?.items.length).toBe(3);
    });

    it('should return undefined when ID does not exist', async () => {
      const watchlist = await getWatchlistEnriched('non-existent-id');
      expect(watchlist).toBeUndefined();
    });

    it('should enrich items with market data', async () => {
      const watchlist = await getWatchlistEnriched('wl-favorites');

      expect(watchlist).toBeDefined();

      const btcItem = watchlist?.items[0];
      expect(btcItem?.price).toBe(50000);
      expect(btcItem?.priceChange24h).toBe(5.2);
      expect(btcItem?.volume24h).toBe(28_000_000_000);
    });

    it('should include real signals array', async () => {
      const watchlist = await getWatchlistEnriched('wl-favorites');

      watchlist?.items.forEach((item) => {
        expect(Array.isArray(item.signals)).toBe(true);
      });
    });

    it('should maintain item order', async () => {
      const watchlist = await getWatchlistEnriched('wl-favorites');

      const ids = watchlist?.items.map((item) => item.id);
      expect(ids).toEqual(['wli-1', 'wli-2', 'wli-3']);
    });

    it('should call market data provider', async () => {
      await getWatchlistEnriched('wl-favorites');

      expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // MARKET DATA INTEGRATION
  // ==========================================================================

  describe('market data integration', () => {
    it('should handle null snapshots gracefully in enriched API', async () => {
      // Mock provider that returns all nulls
      mockProvider = {
        getSnapshot: vi.fn(() => Promise.resolve(null)),
        getSnapshots: vi.fn((queries: MarketQuery[]) => {
          const map = new Map<string, MarketSnapshot | null>();
          for (const q of queries) {
            const key = q.kind === 'token' ? `token:${q.token}` : `market:${q.market}`;
            map.set(key, null);
          }
          return Promise.resolve(map);
        }),
      };

      const watchlists = await listWatchlistsEnriched();
      const allItems = watchlists.flatMap((wl) => wl.items);

      // Items should still have basic data but no price metrics
      allItems.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('symbol');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('kind');

        // Price metrics should be undefined when snapshot is null
        expect(item.price).toBeUndefined();
        expect(item.priceChange24h).toBeUndefined();
        expect(item.volume24h).toBeUndefined();

        // Signals should be empty array (no snapshot = no signals)
        expect(Array.isArray(item.signals)).toBe(true);
        expect(item.signals).toEqual([]);
      });
    });

    it('should use async market data provider for enriched API', async () => {
      const watchlistsPromise = listWatchlistsEnriched();

      // Verify the result IS a Promise
      expect(watchlistsPromise).toBeInstanceOf(Promise);

      const watchlists = await watchlistsPromise;
      expect(Array.isArray(watchlists)).toBe(true);

      // Verify getSnapshots was called
      expect(mockProvider.getSnapshots).toHaveBeenCalled();
    });
  });
});

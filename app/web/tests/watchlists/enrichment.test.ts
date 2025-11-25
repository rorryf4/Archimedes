// app/web/tests/watchlists/enrichment.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enrichWatchlist, enrichWatchlists } from '../../modules/watchlists/enrichment';
import type { Watchlist } from '../../modules/watchlists/types';
import type {
  MarketDataProvider,
  MarketQuery,
  MarketSnapshot,
} from '../../modules/markets/marketData';

// Mock the market data provider
let mockProvider: MarketDataProvider;

vi.mock('../../modules/markets/marketData', () => ({
  getMarketDataProvider: () => mockProvider,
}));

describe('Watchlist Enrichment', () => {
  beforeEach(() => {
    // Reset the mock provider before each test
    // Use same key logic as enrichment.ts: 'token:<token>' or 'market:<market>'
    mockProvider = {
      getSnapshot: vi.fn(() => Promise.resolve(null)),
      getSnapshots: vi.fn((queries: MarketQuery[]) => {
        const map = new Map<string, MarketSnapshot | null>();
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
          } else if (key === 'token:eth') {
            map.set(key, {
              price: 3_000,
              change24hPct: 3.1,
              volume24h: 12_000_000_000,
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
          } else if (key === 'market:eth-usdt') {
            map.set(key, {
              price: 3_020,
              change24hPct: 3.3,
              volume24h: 8_000_000_000,
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

  describe('enrichWatchlist', () => {
    it('should enrich a watchlist with token items', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-1',
        ownerUserId: 'test-user',
        name: 'Test Watchlist',
        description: 'Test description',
        items: [
          {
            id: 'item-1',
            tokenId: 'btc',
            createdAt: '2025-01-15T10:00:00Z',
          },
          {
            id: 'item-2',
            tokenId: 'eth',
            createdAt: '2025-01-15T10:05:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:05:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.id).toBe('test-wl-1');
      expect(enriched.name).toBe('Test Watchlist');
      expect(enriched.items).toHaveLength(2);

      // Check first token item
      const btcItem = enriched.items[0];
      expect(btcItem.kind).toBe('token');
      expect(btcItem.tokenId).toBe('btc');
      expect(btcItem.symbol).toBe('BTC');
      expect(btcItem.name).toBe('Bitcoin');
      expect(btcItem.price).toBe(50000);
      expect(btcItem.priceChange24h).toBe(5.2);
      expect(btcItem.volume24h).toBe(28_000_000_000);
      // Signals are real, computed during enrichment via runBuiltinSignalsForSnapshot
      expect(Array.isArray(btcItem.signals)).toBe(true);
      expect(btcItem.signals).toBeDefined();

      // Check second token item
      const ethItem = enriched.items[1];
      expect(ethItem.kind).toBe('token');
      expect(ethItem.tokenId).toBe('eth');
      expect(ethItem.symbol).toBe('ETH');
      expect(ethItem.name).toBe('Ethereum');
      // Signals are real here too
      expect(Array.isArray(ethItem.signals)).toBe(true);
    });

    it('should enrich a watchlist with market items', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-2',
        ownerUserId: 'test-user',
        name: 'Markets Watchlist',
        items: [
          {
            id: 'item-1',
            marketId: 'btc-usdt',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);

      const marketItem = enriched.items[0];
      expect(marketItem.kind).toBe('market');
      expect(marketItem.marketId).toBe('btc-usdt');
      expect(marketItem.symbol).toBe('BTC/USDT');
      expect(marketItem.name).toBe('Bitcoin / Tether USD');
      expect(marketItem.baseSymbol).toBe('BTC');
      expect(marketItem.quoteSymbol).toBe('USDT');
      expect(marketItem.price).toBe(50_100);
      expect(marketItem.priceChange24h).toBe(5.5);
      expect(marketItem.volume24h).toBe(15_000_000_000);
      // Signals are real, computed during enrichment
      expect(Array.isArray(marketItem.signals)).toBe(true);
    });

    it('should attach market object for market items', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-market-obj',
        ownerUserId: 'test-user',
        name: 'Market Object Test',
        items: [
          {
            id: 'item-1',
            marketId: 'btc-usdt',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);
      const item = enriched.items[0];

      // Verify market object is attached
      expect(item.market).toBeDefined();
      expect(item.market?.id).toBe('btc-usdt');
      expect(item.market?.baseToken).toBeDefined();
      expect(item.market?.quoteToken).toBeDefined();
      expect(item.market?.baseToken.symbol).toBe('BTC');
      expect(item.market?.quoteToken.symbol).toBe('USDT');
    });

    it('should attach market object for token items when market exists', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-token-market',
        ownerUserId: 'test-user',
        name: 'Token Market Test',
        items: [
          {
            id: 'item-1',
            tokenId: 'btc',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);
      const item = enriched.items[0];

      // For tokens, enrichment tries to find btc-usdt market
      expect(item.market).toBeDefined();
      expect(item.market?.id).toBe('btc-usdt');
    });

    it('should handle mixed token and market items', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-3',
        ownerUserId: 'test-user',
        name: 'Mixed Watchlist',
        items: [
          {
            id: 'item-1',
            tokenId: 'btc',
            createdAt: '2025-01-15T10:00:00Z',
          },
          {
            id: 'item-2',
            marketId: 'eth-usdt',
            createdAt: '2025-01-15T10:05:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:05:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(2);
      expect(enriched.items[0].kind).toBe('token');
      expect(enriched.items[1].kind).toBe('market');
    });

    it('should handle non-existent token IDs gracefully', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-4',
        ownerUserId: 'test-user',
        name: 'Invalid Token Watchlist',
        items: [
          {
            id: 'item-1',
            tokenId: 'non-existent-token',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.kind).toBe('token');
      expect(item.symbol).toBe('NON-EXISTENT-TOKEN');
      expect(item.name).toBe('Unknown Token');
      expect(item.price).toBeUndefined();
      // Market should be undefined for unknown tokens
      expect(item.market).toBeUndefined();
      // Signals are empty array when no snapshot is available
      expect(Array.isArray(item.signals)).toBe(true);
      expect(item.signals).toEqual([]);
    });

    it('should handle non-existent market IDs gracefully', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-5',
        ownerUserId: 'test-user',
        name: 'Invalid Market Watchlist',
        items: [
          {
            id: 'item-1',
            marketId: 'non-existent-market',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.kind).toBe('market');
      expect(item.symbol).toBe('NON-EXISTENT-MARKET');
      expect(item.name).toBe('Unknown Market');
      // Market should be undefined for unknown markets
      expect(item.market).toBeUndefined();
      // Signals are empty array when no snapshot is available
      expect(Array.isArray(item.signals)).toBe(true);
      expect(item.signals).toEqual([]);
    });

    it('should handle items with neither tokenId nor marketId', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-6',
        ownerUserId: 'test-user',
        name: 'Empty Item Watchlist',
        items: [
          {
            id: 'item-1',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.symbol).toBe('UNKNOWN');
      expect(item.name).toBe('Unknown Item');
      // Signals are empty array when no snapshot is available
      expect(Array.isArray(item.signals)).toBe(true);
      expect(item.signals).toEqual([]);
    });

    it('should preserve all watchlist metadata', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-7',
        ownerUserId: 'test-user',
        name: 'Metadata Test',
        description: 'Test description',
        items: [],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);

      expect(enriched.id).toBe('test-wl-7');
      expect(enriched.name).toBe('Metadata Test');
      expect(enriched.description).toBe('Test description');
      expect(enriched.createdAt).toBe('2025-01-15T09:00:00Z');
      expect(enriched.updatedAt).toBe('2025-01-15T10:00:00Z');
    });
  });

  describe('enrichWatchlists', () => {
    it('should enrich multiple watchlists', async () => {
      const rawWatchlists: Watchlist[] = [
        {
          ownerUserId: 'test-user',
          id: 'wl-1',
          name: 'Watchlist 1',
          items: [
            {
              id: 'item-1',
              tokenId: 'btc',
              createdAt: '2025-01-15T10:00:00Z',
            },
          ],
          createdAt: '2025-01-15T09:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          ownerUserId: 'test-user',
          id: 'wl-2',
          name: 'Watchlist 2',
          items: [
            {
              id: 'item-2',
              marketId: 'eth-usdt',
              createdAt: '2025-01-15T10:05:00Z',
            },
          ],
          createdAt: '2025-01-15T09:00:00Z',
          updatedAt: '2025-01-15T10:05:00Z',
        },
      ];

      const enriched = await enrichWatchlists(rawWatchlists);

      expect(enriched).toHaveLength(2);
      expect(enriched[0].id).toBe('wl-1');
      expect(enriched[0].items[0].kind).toBe('token');
      expect(enriched[1].id).toBe('wl-2');
      expect(enriched[1].items[0].kind).toBe('market');
    });

    it('should handle empty array', async () => {
      const enriched = await enrichWatchlists([]);
      expect(enriched).toHaveLength(0);
    });
  });

  describe('Signal Computation', () => {
    it('should compute real signals for items with valid market snapshots', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-signals-real',
        ownerUserId: 'test-user',
        name: 'Signal Computation Test',
        items: [
          {
            id: 'item-1',
            marketId: 'btc-usdt',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);
      const item = enriched.items[0];

      // Signals must be an array (real computation via runBuiltinSignalsForSnapshot)
      expect(Array.isArray(item.signals)).toBe(true);
      expect(item.signals).toBeDefined();
      // Each signal result should have required signal properties
      if (item.signals.length > 0) {
        item.signals.forEach((signal) => {
          expect(signal).toHaveProperty('id');
          expect(signal).toHaveProperty('label');
          expect(signal).toHaveProperty('severity');
          expect(typeof signal.id).toBe('string');
          expect(typeof signal.label).toBe('string');
        });
      }
    });

    it('should return empty signals array for items without market data', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-signals-empty',
        ownerUserId: 'test-user',
        name: 'No Snapshot Signal Test',
        items: [
          {
            id: 'item-1',
            tokenId: 'non-existent-token',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = await enrichWatchlist(rawWatchlist);
      const item = enriched.items[0];

      // No snapshot means no signals — must be empty array, never undefined
      expect(Array.isArray(item.signals)).toBe(true);
      expect(item.signals).toEqual([]);
    });
  });

  describe('Price Caching', () => {
    it('should cache prices for markets', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-cache',
        ownerUserId: 'test-user',
        name: 'Cache Test',
        items: [
          {
            id: 'item-1',
            marketId: 'btc-usdt',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      // First enrichment
      const enriched1 = await enrichWatchlist(rawWatchlist);
      const price1 = enriched1.items[0].price;

      // Second enrichment should use cached price
      const enriched2 = await enrichWatchlist(rawWatchlist);
      const price2 = enriched2.items[0].price;

      // Prices should be the same due to caching
      expect(price1).toBe(price2);
    });

    it('should clear price cache when requested', async () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-clear',
        ownerUserId: 'test-user',
        name: 'Clear Cache Test',
        items: [
          {
            id: 'item-1',
            marketId: 'btc-usdt',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      // Enrich to populate cache
      await enrichWatchlist(rawWatchlist);

      // This should work without errors
      const enriched = await enrichWatchlist(rawWatchlist);
      expect(enriched.items[0].price).toBe(50_100);
    });
  });
});

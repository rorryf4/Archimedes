// app/web/tests/watchlists/enrichment.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { enrichWatchlist, enrichWatchlists, clearPriceCache } from '../../modules/watchlists/enrichment';
import type { Watchlist } from '../../modules/watchlists/types';

describe('Watchlist Enrichment', () => {
  beforeEach(() => {
    clearPriceCache();
  });

  describe('enrichWatchlist', () => {
    it('should enrich a watchlist with token items', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-1',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.id).toBe('test-wl-1');
      expect(enriched.name).toBe('Test Watchlist');
      expect(enriched.items).toHaveLength(2);

      // Check first token item
      const btcItem = enriched.items[0];
      expect(btcItem.kind).toBe('token');
      expect(btcItem.tokenId).toBe('btc');
      expect(btcItem.symbol).toBe('BTC');
      expect(btcItem.name).toBe('Bitcoin');
      expect(btcItem.price).toBeDefined();
      expect(typeof btcItem.price).toBe('number');
      expect(btcItem.priceChange24h).toBeDefined();
      expect(btcItem.volume24h).toBeDefined();

      // Check second token item
      const ethItem = enriched.items[1];
      expect(ethItem.kind).toBe('token');
      expect(ethItem.tokenId).toBe('eth');
      expect(ethItem.symbol).toBe('ETH');
      expect(ethItem.name).toBe('Ethereum');
    });

    it('should enrich a watchlist with market items', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-2',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);

      const marketItem = enriched.items[0];
      expect(marketItem.kind).toBe('market');
      expect(marketItem.marketId).toBe('btc-usdt');
      expect(marketItem.symbol).toBe('BTC/USDT');
      expect(marketItem.name).toBe('Bitcoin / Tether USD');
      expect(marketItem.baseSymbol).toBe('BTC');
      expect(marketItem.quoteSymbol).toBe('USDT');
      expect(marketItem.price).toBeDefined();
      expect(marketItem.priceChange24h).toBeDefined();
      expect(marketItem.volume24h).toBeDefined();
    });

    it('should handle mixed token and market items', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-3',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(2);
      expect(enriched.items[0].kind).toBe('token');
      expect(enriched.items[1].kind).toBe('market');
    });

    it('should handle non-existent token IDs gracefully', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-4',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.kind).toBe('token');
      expect(item.symbol).toBe('NON-EXISTENT-TOKEN');
      expect(item.name).toBe('Unknown Token');
      expect(item.price).toBeUndefined();
    });

    it('should handle non-existent market IDs gracefully', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-5',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.kind).toBe('market');
      expect(item.symbol).toBe('NON-EXISTENT-MARKET');
      expect(item.name).toBe('Unknown Market');
    });

    it('should handle items with neither tokenId nor marketId', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-6',
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

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.items).toHaveLength(1);
      const item = enriched.items[0];
      expect(item.symbol).toBe('UNKNOWN');
      expect(item.name).toBe('Unknown Item');
    });

    it('should preserve all watchlist metadata', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-7',
        name: 'Metadata Test',
        description: 'Test description',
        items: [],
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const enriched = enrichWatchlist(rawWatchlist);

      expect(enriched.id).toBe('test-wl-7');
      expect(enriched.name).toBe('Metadata Test');
      expect(enriched.description).toBe('Test description');
      expect(enriched.createdAt).toBe('2025-01-15T09:00:00Z');
      expect(enriched.updatedAt).toBe('2025-01-15T10:00:00Z');
    });
  });

  describe('enrichWatchlists', () => {
    it('should enrich multiple watchlists', () => {
      const rawWatchlists: Watchlist[] = [
        {
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

      const enriched = enrichWatchlists(rawWatchlists);

      expect(enriched).toHaveLength(2);
      expect(enriched[0].id).toBe('wl-1');
      expect(enriched[0].items[0].kind).toBe('token');
      expect(enriched[1].id).toBe('wl-2');
      expect(enriched[1].items[0].kind).toBe('market');
    });

    it('should handle empty array', () => {
      const enriched = enrichWatchlists([]);
      expect(enriched).toHaveLength(0);
    });
  });

  describe('Price Caching', () => {
    it('should cache prices for markets', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-cache',
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
      const enriched1 = enrichWatchlist(rawWatchlist);
      const price1 = enriched1.items[0].price;

      // Second enrichment should use cached price
      const enriched2 = enrichWatchlist(rawWatchlist);
      const price2 = enriched2.items[0].price;

      // Prices should be the same due to caching
      expect(price1).toBe(price2);
    });

    it('should clear price cache when requested', () => {
      const rawWatchlist: Watchlist = {
        id: 'test-wl-clear',
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
      enrichWatchlist(rawWatchlist);

      // Clear cache
      clearPriceCache();

      // This should work without errors
      const enriched = enrichWatchlist(rawWatchlist);
      expect(enriched.items[0].price).toBeDefined();
    });
  });
});

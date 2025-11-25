import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWatchlistSummaries,
  getTopMovers,
  getTopMoversEnriched,
} from '../../modules/watchlists/dashboard';
import type { WatchlistEnriched } from '../../modules/watchlists/types';

vi.mock('../../modules/watchlists/service', () => ({
  listWatchlists: vi.fn(),
  listWatchlistsEnriched: vi.fn(),
}));

import { listWatchlists, listWatchlistsEnriched } from '../../modules/watchlists/service';

describe('watchlists dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWatchlistSummaries', () => {
    it('should return summaries with correct item counts and metadata', () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Favorites',
          description: 'My favorite assets',
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          items: [
            {
              id: 'wli-1',
              kind: 'token',
              tokenId: 'btc',
              marketId: undefined,
              symbol: 'BTC',
              name: 'Bitcoin',
              createdAt: '2025-01-01T00:00:00Z',
              price: 50000,
              priceChange24h: 5.2,
              volume24h: 28000000000,
              signals: [],
            },
            {
              id: 'wli-2',
              kind: 'market',
              tokenId: undefined,
              marketId: 'eth-usdt',
              symbol: 'ETH/USDT',
              name: 'Ethereum / Tether',
              baseSymbol: 'ETH',
              quoteSymbol: 'USDT',
              createdAt: '2025-01-01T00:00:00Z',
              price: 3000,
              priceChange24h: 3.1,
              volume24h: 12000000000,
              signals: [],
            },
          ],
        },
        {
          id: 'wl-2',
          name: 'Trending',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
          items: [
            {
              id: 'wli-3',
              kind: 'token',
              tokenId: 'sol',
              marketId: undefined,
              symbol: 'SOL',
              name: 'Solana',
              createdAt: '2025-01-03T00:00:00Z',
              price: 100,
              priceChange24h: -2.5,
              volume24h: 5000000000,
              signals: [],
            },
          ],
        },
      ];

      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const summaries = getWatchlistSummaries();

      expect(summaries).toHaveLength(2);

      expect(summaries[0]).toEqual({
        id: 'wl-1',
        name: 'Favorites',
        description: 'My favorite assets',
        ownerUserId: 'user-1',
        itemCount: 2,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      });

      expect(summaries[1]).toEqual({
        id: 'wl-2',
        name: 'Trending',
        description: null,
        ownerUserId: 'user-1',
        itemCount: 1,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      });
    });
  });

  describe('getTopMovers', () => {
    it('should sort by absolute 24h change and respect limit', () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: [
            {
              id: 'wli-1',
              kind: 'token',
              tokenId: 'btc',
              marketId: undefined,
              symbol: 'BTC',
              name: 'Bitcoin',
              createdAt: '2025-01-01T00:00:00Z',
              price: 50000,
              priceChange24h: -8.0,
              volume24h: 28000000000,
              signals: [],
            },
            {
              id: 'wli-2',
              kind: 'token',
              tokenId: 'eth',
              marketId: undefined,
              symbol: 'ETH',
              name: 'Ethereum',
              createdAt: '2025-01-01T00:00:00Z',
              price: 3000,
              priceChange24h: 5.0,
              volume24h: 12000000000,
              signals: [],
            },
            {
              id: 'wli-3',
              kind: 'token',
              tokenId: 'sol',
              marketId: undefined,
              symbol: 'SOL',
              name: 'Solana',
              createdAt: '2025-01-01T00:00:00Z',
              price: 100,
              priceChange24h: 2.0,
              volume24h: 5000000000,
              signals: [],
            },
            {
              id: 'wli-4',
              kind: 'token',
              tokenId: 'ada',
              marketId: undefined,
              symbol: 'ADA',
              name: 'Cardano',
              createdAt: '2025-01-01T00:00:00Z',
              price: 0.5,
              priceChange24h: undefined,
              volume24h: 1000000000,
              signals: [],
            },
          ],
        },
      ];

      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const topMovers = getTopMovers(3);

      expect(topMovers).toHaveLength(3);

      expect(topMovers[0].id).toBe('wli-1');
      expect(topMovers[0].priceChange24h).toBe(-8.0);
      expect(topMovers[0].absoluteChange24h).toBe(8.0);

      expect(topMovers[1].id).toBe('wli-2');
      expect(topMovers[1].priceChange24h).toBe(5.0);
      expect(topMovers[1].absoluteChange24h).toBe(5.0);

      expect(topMovers[2].id).toBe('wli-3');
      expect(topMovers[2].priceChange24h).toBe(2.0);
      expect(topMovers[2].absoluteChange24h).toBe(2.0);

      expect(topMovers.every((item) => item.priceChange24h !== undefined)).toBe(
        true
      );
    });

    it('should return empty array when no items have price changes', () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: [
            {
              id: 'wli-1',
              kind: 'token',
              tokenId: 'btc',
              marketId: undefined,
              symbol: 'BTC',
              name: 'Bitcoin',
              createdAt: '2025-01-01T00:00:00Z',
              price: undefined,
              priceChange24h: undefined,
              volume24h: undefined,
              signals: [],
            },
            {
              id: 'wli-2',
              kind: 'token',
              tokenId: 'eth',
              marketId: undefined,
              symbol: 'ETH',
              name: 'Ethereum',
              createdAt: '2025-01-01T00:00:00Z',
              price: undefined,
              priceChange24h: undefined,
              volume24h: undefined,
              signals: [],
            },
          ],
        },
      ];

      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const topMovers = getTopMovers();

      expect(topMovers).toEqual([]);
    });

    it('should default to limit of 5', () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `wli-${i}`,
            kind: 'token' as const,
            tokenId: `token-${i}`,
            marketId: undefined,
            symbol: `TOK${i}`,
            name: `Token ${i}`,
            createdAt: '2025-01-01T00:00:00Z',
            price: 100 + i,
            priceChange24h: i + 1,
            volume24h: 1000000000,
            signals: [],
          })),
        },
      ];

      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const topMovers = getTopMovers();

      expect(topMovers).toHaveLength(5);
    });
  });

  describe('getTopMoversEnriched', () => {
    it('should sort by absolute 24h change and respect limit (async enriched version)', async () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: [
            {
              id: 'wli-1',
              kind: 'token',
              tokenId: 'btc',
              marketId: undefined,
              symbol: 'BTC',
              name: 'Bitcoin',
              createdAt: '2025-01-01T00:00:00Z',
              price: 50000,
              priceChange24h: -8.0,
              volume24h: 28000000000,
              signals: [],
            },
            {
              id: 'wli-2',
              kind: 'token',
              tokenId: 'eth',
              marketId: undefined,
              symbol: 'ETH',
              name: 'Ethereum',
              createdAt: '2025-01-01T00:00:00Z',
              price: 3000,
              priceChange24h: 5.0,
              volume24h: 12000000000,
              signals: [],
            },
            {
              id: 'wli-3',
              kind: 'token',
              tokenId: 'sol',
              marketId: undefined,
              symbol: 'SOL',
              name: 'Solana',
              createdAt: '2025-01-01T00:00:00Z',
              price: 100,
              priceChange24h: 2.0,
              volume24h: 5000000000,
              signals: [],
            },
            {
              id: 'wli-4',
              kind: 'token',
              tokenId: 'ada',
              marketId: undefined,
              symbol: 'ADA',
              name: 'Cardano',
              createdAt: '2025-01-01T00:00:00Z',
              price: 0.5,
              priceChange24h: undefined,
              volume24h: 1000000000,
              signals: [],
            },
          ],
        },
      ];

      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const topMovers = await getTopMoversEnriched(3);

      expect(topMovers).toHaveLength(3);

      expect(topMovers[0].id).toBe('wli-1');
      expect(topMovers[0].priceChange24h).toBe(-8.0);
      expect(topMovers[0].absoluteChange24h).toBe(8.0);

      expect(topMovers[1].id).toBe('wli-2');
      expect(topMovers[1].priceChange24h).toBe(5.0);
      expect(topMovers[1].absoluteChange24h).toBe(5.0);

      expect(topMovers[2].id).toBe('wli-3');
      expect(topMovers[2].priceChange24h).toBe(2.0);
      expect(topMovers[2].absoluteChange24h).toBe(2.0);

      expect(topMovers.every((item) => item.priceChange24h !== undefined)).toBe(
        true
      );
    });

    it('should return empty array when no items have price changes (enriched)', async () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: [
            {
              id: 'wli-1',
              kind: 'token',
              tokenId: 'btc',
              marketId: undefined,
              symbol: 'BTC',
              name: 'Bitcoin',
              createdAt: '2025-01-01T00:00:00Z',
              price: undefined,
              priceChange24h: undefined,
              volume24h: undefined,
              signals: [],
            },
            {
              id: 'wli-2',
              kind: 'token',
              tokenId: 'eth',
              marketId: undefined,
              symbol: 'ETH',
              name: 'Ethereum',
              createdAt: '2025-01-01T00:00:00Z',
              price: undefined,
              priceChange24h: undefined,
              volume24h: undefined,
              signals: [],
            },
          ],
        },
      ];

      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const topMovers = await getTopMoversEnriched();

      expect(topMovers).toEqual([]);
    });

    it('should default to limit of 5 (enriched)', async () => {
      const mockWatchlists: WatchlistEnriched[] = [
        {
          id: 'wl-1',
          name: 'Test',
          description: undefined,
          ownerUserId: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `wli-${i}`,
            kind: 'token' as const,
            tokenId: `token-${i}`,
            marketId: undefined,
            symbol: `TOK${i}`,
            name: `Token ${i}`,
            createdAt: '2025-01-01T00:00:00Z',
            price: 100 + i,
            priceChange24h: i + 1,
            volume24h: 1000000000,
            signals: [],
          })),
        },
      ];

      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const topMovers = await getTopMoversEnriched();

      expect(topMovers).toHaveLength(5);
    });
  });
});

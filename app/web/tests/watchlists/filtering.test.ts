import { describe, it, expect } from 'vitest';
import {
  searchWatchlists,
  filterAndSortItems,
  filterAndSortTopMovers,
} from '../../modules/watchlists/filtering';
import type { DashboardWatchlistSummary, DashboardTopMover } from '../../modules/watchlists/dashboard';
import type { WatchlistItemEnriched } from '../../modules/watchlists/types';

describe('watchlists filtering', () => {
  describe('searchWatchlists', () => {
    const mockWatchlists: DashboardWatchlistSummary[] = [
      {
        id: 'wl-1',
        name: 'My Favorites',
        description: 'Top cryptocurrencies I watch',
        ownerUserId: 'user-1',
        itemCount: 5,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'wl-2',
        name: 'DeFi Tokens',
        description: 'Decentralized finance tokens',
        ownerUserId: 'user-1',
        itemCount: 3,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
      {
        id: 'wl-3',
        name: 'Trending',
        description: null,
        ownerUserId: 'user-1',
        itemCount: 2,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      },
    ];

    it('should return original array when query is empty', () => {
      const result = searchWatchlists(mockWatchlists, '');
      expect(result).toEqual(mockWatchlists);
    });

    it('should return original array when query is whitespace', () => {
      const result = searchWatchlists(mockWatchlists, '   ');
      expect(result).toEqual(mockWatchlists);
    });

    it('should filter by name (case-insensitive)', () => {
      const result = searchWatchlists(mockWatchlists, 'defi');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wl-2');
    });

    it('should filter by description (case-insensitive)', () => {
      const result = searchWatchlists(mockWatchlists, 'decentralized');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wl-2');
    });

    it('should match multiple watchlists', () => {
      const result = searchWatchlists(mockWatchlists, 'token');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wl-2');
    });

    it('should handle case-insensitive matching', () => {
      const result1 = searchWatchlists(mockWatchlists, 'FAVORITES');
      const result2 = searchWatchlists(mockWatchlists, 'favorites');
      const result3 = searchWatchlists(mockWatchlists, 'FaVoRiTeS');

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);
      expect(result1[0].id).toBe('wl-1');
      expect(result2[0].id).toBe('wl-1');
      expect(result3[0].id).toBe('wl-1');
    });

    it('should return empty array when no matches', () => {
      const result = searchWatchlists(mockWatchlists, 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('filterAndSortItems', () => {
    const mockItems: WatchlistItemEnriched[] = [
      {
        id: 'item-1',
        kind: 'token',
        tokenId: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        createdAt: '2025-01-01T00:00:00Z',
        price: 50000,
        priceChange24h: 5.2,
        volume24h: 28000000000,
        signals: [],
      },
      {
        id: 'item-2',
        kind: 'market',
        marketId: 'eth-usdt',
        symbol: 'ETH/USDT',
        name: 'Ethereum / Tether',
        baseSymbol: 'ETH',
        quoteSymbol: 'USDT',
        createdAt: '2025-01-02T00:00:00Z',
        price: 3000,
        priceChange24h: -3.1,
        volume24h: 12000000000,
        signals: [],
      },
      {
        id: 'item-3',
        kind: 'token',
        tokenId: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        createdAt: '2025-01-03T00:00:00Z',
        price: 100,
        priceChange24h: 8.5,
        volume24h: 5000000000,
        signals: [],
      },
      {
        id: 'item-4',
        kind: 'token',
        tokenId: 'ada',
        symbol: 'ADA',
        name: 'Cardano',
        createdAt: '2025-01-04T00:00:00Z',
        price: undefined,
        priceChange24h: undefined,
        volume24h: undefined,
        signals: [],
      },
    ];

    it('should filter by kind: tokens only', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'token',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result.every((item) => item.kind === 'token')).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should filter by kind: markets only', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'market',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result.every((item) => item.kind === 'market')).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-2');
    });

    it('should show all items when kind is "all"', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result).toHaveLength(4);
    });

    it('should filter by text search on symbol', () => {
      const result = filterAndSortItems(mockItems, {
        query: 'BTC',
        kind: 'all',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });

    it('should filter by text search on name', () => {
      const result = filterAndSortItems(mockItems, {
        query: 'ethereum',
        kind: 'all',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-2');
    });

    it('should perform case-insensitive search', () => {
      const result = filterAndSortItems(mockItems, {
        query: 'SOLANA',
        kind: 'all',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-3');
    });

    it('should sort by name ascending', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'name',
        direction: 'asc',
      });

      const names = result.map((item) => item.name);
      expect(names).toEqual(['Bitcoin', 'Cardano', 'Ethereum / Tether', 'Solana']);
    });

    it('should sort by name descending', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'name',
        direction: 'desc',
      });

      const names = result.map((item) => item.name);
      expect(names).toEqual(['Solana', 'Ethereum / Tether', 'Cardano', 'Bitcoin']);
    });

    it('should sort by price ascending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'price',
        direction: 'asc',
      });

      const ids = result.map((item) => item.id);
      expect(ids).toEqual(['item-3', 'item-2', 'item-1', 'item-4']);
    });

    it('should sort by price descending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'price',
        direction: 'desc',
      });

      const ids = result.map((item) => item.id);
      expect(ids).toEqual(['item-1', 'item-2', 'item-3', 'item-4']);
    });

    it('should sort by change (absolute) ascending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'changeAbs',
        direction: 'asc',
      });

      const ids = result.map((item) => item.id);
      // abs: 3.1, 5.2, 8.5, undefined
      expect(ids).toEqual(['item-2', 'item-1', 'item-3', 'item-4']);
    });

    it('should sort by change (absolute) descending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'changeAbs',
        direction: 'desc',
      });

      const ids = result.map((item) => item.id);
      // abs desc: 8.5, 5.2, 3.1, undefined
      expect(ids).toEqual(['item-3', 'item-1', 'item-2', 'item-4']);
    });

    it('should sort by volume ascending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'volume',
        direction: 'asc',
      });

      const ids = result.map((item) => item.id);
      expect(ids).toEqual(['item-3', 'item-2', 'item-1', 'item-4']);
    });

    it('should sort by volume descending with undefined last', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'all',
        sortBy: 'volume',
        direction: 'desc',
      });

      const ids = result.map((item) => item.id);
      expect(ids).toEqual(['item-1', 'item-2', 'item-3', 'item-4']);
    });

    it('should combine filter and sort', () => {
      const result = filterAndSortItems(mockItems, {
        query: '',
        kind: 'token',
        sortBy: 'price',
        direction: 'desc',
      });

      expect(result).toHaveLength(3);
      const ids = result.map((item) => item.id);
      expect(ids).toEqual(['item-1', 'item-3', 'item-4']);
    });

    it('should combine search, filter, and sort', () => {
      const result = filterAndSortItems(mockItems, {
        query: 'a', // Matches Cardano and Solana
        kind: 'token',
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result).toHaveLength(2);
      const names = result.map((item) => item.name);
      expect(names).toEqual(['Cardano', 'Solana']);
    });
  });

  describe('filterAndSortTopMovers', () => {
    const mockMovers: DashboardTopMover[] = [
      {
        id: 'item-1',
        watchlistId: 'wl-1',
        kind: 'token',
        tokenId: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        priceChange24h: 5.2,
        volume24h: 28000000000,
        absoluteChange24h: 5.2,
      },
      {
        id: 'item-2',
        watchlistId: 'wl-1',
        kind: 'token',
        tokenId: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3000,
        priceChange24h: -8.5,
        volume24h: 12000000000,
        absoluteChange24h: 8.5,
      },
      {
        id: 'item-3',
        watchlistId: 'wl-1',
        kind: 'token',
        tokenId: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        price: 100,
        priceChange24h: 2.1,
        volume24h: 5000000000,
        absoluteChange24h: 2.1,
      },
      {
        id: 'item-4',
        watchlistId: 'wl-1',
        kind: 'token',
        tokenId: 'ada',
        symbol: 'ADA',
        name: 'Cardano',
        price: undefined,
        priceChange24h: undefined,
        volume24h: undefined,
        absoluteChange24h: undefined,
      },
    ];

    it('should filter by text search on symbol', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: 'btc',
        sortBy: 'changeAbs',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });

    it('should filter by text search on name', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: 'ethereum',
        sortBy: 'changeAbs',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-2');
    });

    it('should perform case-insensitive search', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: 'SOLANA',
        sortBy: 'changeAbs',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-3');
    });

    it('should return all items when query is empty', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: '',
        sortBy: 'changeAbs',
      });

      expect(result).toHaveLength(4);
    });

    it('should sort by changeAbs descending with undefined last', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: '',
        sortBy: 'changeAbs',
      });

      const ids = result.map((mover) => mover.id);
      // abs desc: 8.5, 5.2, 2.1, undefined
      expect(ids).toEqual(['item-2', 'item-1', 'item-3', 'item-4']);
    });

    it('should sort by price descending with undefined last', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: '',
        sortBy: 'price',
      });

      const ids = result.map((mover) => mover.id);
      expect(ids).toEqual(['item-1', 'item-2', 'item-3', 'item-4']);
    });

    it('should sort by volume descending with undefined last', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: '',
        sortBy: 'volume',
      });

      const ids = result.map((mover) => mover.id);
      expect(ids).toEqual(['item-1', 'item-2', 'item-3', 'item-4']);
    });

    it('should use priceChange24h to compute absoluteChange24h if not provided', () => {
      const moversWithoutAbs: DashboardTopMover[] = [
        {
          id: 'item-1',
          watchlistId: 'wl-1',
          kind: 'token',
          tokenId: 'btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          priceChange24h: -10.0,
          volume24h: 28000000000,
          absoluteChange24h: undefined,
        },
        {
          id: 'item-2',
          watchlistId: 'wl-1',
          kind: 'token',
          tokenId: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          priceChange24h: 5.0,
          volume24h: 12000000000,
          absoluteChange24h: undefined,
        },
      ];

      const result = filterAndSortTopMovers(moversWithoutAbs, {
        query: '',
        sortBy: 'changeAbs',
      });

      const ids = result.map((mover) => mover.id);
      // abs desc: 10.0, 5.0
      expect(ids).toEqual(['item-1', 'item-2']);
    });

    it('should combine search and sort', () => {
      const result = filterAndSortTopMovers(mockMovers, {
        query: 'a', // Matches Cardano and Solana
        sortBy: 'changeAbs',
      });

      expect(result).toHaveLength(2);
      const ids = result.map((mover) => mover.id);
      // abs desc: 2.1, undefined
      expect(ids).toEqual(['item-3', 'item-4']);
    });
  });
});

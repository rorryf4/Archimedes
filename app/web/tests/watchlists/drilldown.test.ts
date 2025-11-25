import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItemById, getItemByIdEnriched, getWatchlistsForItem } from '../../modules/watchlists/drilldown';
import type { WatchlistEnriched } from '../../modules/watchlists/types';
import type { SignalResult } from '../../modules/signals/types';

vi.mock('../../modules/watchlists/service', () => ({
  listWatchlists: vi.fn(),
  listWatchlistsEnriched: vi.fn(),
}));

import { listWatchlists, listWatchlistsEnriched } from '../../modules/watchlists/service';

describe('watchlists drilldown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSignals: SignalResult[] = [
    {
      id: 'volume_burst_1m',
      label: '1m Volume Burst',
      value: 150,
      unit: '%',
      severity: 'action',
      timestamp: '2025-01-01T12:00:00Z',
    },
    {
      id: 'volume_burst_5m',
      label: '5m Volume Burst',
      value: 80,
      unit: '%',
      severity: 'info',
      timestamp: '2025-01-01T12:00:00Z',
    },
  ];

  const mockWatchlists: WatchlistEnriched[] = [
    {
      id: 'wl-1',
      name: 'Favorites',
      description: 'My favorites',
      ownerUserId: 'user-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      items: [
        {
          id: 'item-btc',
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
          id: 'item-eth-usdt',
          kind: 'market',
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
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      items: [
        {
          id: 'item-btc',
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
          id: 'item-sol',
          kind: 'token',
          tokenId: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          createdAt: '2025-01-02T00:00:00Z',
          price: 100,
          priceChange24h: -2.5,
          volume24h: 5000000000,
          signals: mockSignals,
        },
      ],
    },
  ];

  describe('getItemById', () => {
    it('should return item with watchlist references when found', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getItemById('item-btc');

      expect(result).toBeDefined();
      expect(result?.id).toBe('item-btc');
      expect(result?.symbol).toBe('BTC');
      expect(result?.name).toBe('Bitcoin');
      expect(result?.kind).toBe('token');
      expect(result?.tokenId).toBe('btc');
      expect(result?.price).toBe(50000);
      expect(result?.priceChange24h).toBe(5.2);
      expect(result?.volume24h).toBe(28000000000);
      expect(result?.watchlists).toHaveLength(2);
      expect(result?.watchlists).toContainEqual({ id: 'wl-1', name: 'Favorites' });
      expect(result?.watchlists).toContainEqual({ id: 'wl-2', name: 'Trending' });
    });

    it('should return market item with base/quote symbols', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getItemById('item-eth-usdt');

      expect(result).toBeDefined();
      expect(result?.id).toBe('item-eth-usdt');
      expect(result?.kind).toBe('market');
      expect(result?.marketId).toBe('eth-usdt');
      expect(result?.symbol).toBe('ETH/USDT');
      expect(result?.baseSymbol).toBe('ETH');
      expect(result?.quoteSymbol).toBe('USDT');
      expect(result?.watchlists).toHaveLength(1);
      expect(result?.watchlists[0].id).toBe('wl-1');
    });

    it('should return undefined when item not found', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getItemById('non-existent-item');

      expect(result).toBeUndefined();
    });

    it('should return undefined when no watchlists exist', () => {
      vi.mocked(listWatchlists).mockReturnValue([]);

      const result = getItemById('item-btc');

      expect(result).toBeUndefined();
    });
  });

  describe('getItemByIdEnriched', () => {
    it('should return enriched item with signals when found', async () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);
      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const result = await getItemByIdEnriched('item-sol');

      expect(result).toBeDefined();
      expect(result?.id).toBe('item-sol');
      expect(result?.symbol).toBe('SOL');
      expect(result?.signals).toHaveLength(2);
      expect(result?.signals[0].id).toBe('volume_burst_1m');
      expect(result?.signals[0].severity).toBe('action');
      expect(result?.signals[1].id).toBe('volume_burst_5m');
      expect(result?.signals[1].severity).toBe('info');
    });

    it('should return item with empty signals array when no signals', async () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);
      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const result = await getItemByIdEnriched('item-btc');

      expect(result).toBeDefined();
      expect(result?.id).toBe('item-btc');
      expect(result?.signals).toEqual([]);
    });

    it('should return undefined when item not found', async () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);
      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const result = await getItemByIdEnriched('non-existent-item');

      expect(result).toBeUndefined();
    });

    it('should return undefined when no watchlists exist', async () => {
      vi.mocked(listWatchlists).mockReturnValue([]);
      vi.mocked(listWatchlistsEnriched).mockResolvedValue([]);

      const result = await getItemByIdEnriched('item-btc');

      expect(result).toBeUndefined();
    });

    it('should include watchlist references', async () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);
      vi.mocked(listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      const result = await getItemByIdEnriched('item-sol');

      expect(result?.watchlists).toHaveLength(1);
      expect(result?.watchlists[0]).toEqual({ id: 'wl-2', name: 'Trending' });
    });
  });

  describe('getWatchlistsForItem', () => {
    it('should return all watchlists containing the item', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getWatchlistsForItem('item-btc');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'wl-1', name: 'Favorites' });
      expect(result).toContainEqual({ id: 'wl-2', name: 'Trending' });
    });

    it('should return single watchlist when item is only in one', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getWatchlistsForItem('item-sol');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'wl-2', name: 'Trending' });
    });

    it('should return empty array when item not in any watchlist', () => {
      vi.mocked(listWatchlists).mockReturnValue(mockWatchlists);

      const result = getWatchlistsForItem('non-existent-item');

      expect(result).toEqual([]);
    });

    it('should return empty array when no watchlists exist', () => {
      vi.mocked(listWatchlists).mockReturnValue([]);

      const result = getWatchlistsForItem('item-btc');

      expect(result).toEqual([]);
    });
  });
});

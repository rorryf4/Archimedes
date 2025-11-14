import { describe, it, expect } from 'vitest';
import {
  listWatchlists,
  getWatchlistById,
  listWatchlistsWithRelations,
  getWatchlistWithRelationsById,
} from '@/modules/watchlists';

describe('watchlists service', () => {
  describe('listWatchlists', () => {
    it('should return an array of watchlists', () => {
      const watchlists = listWatchlists();
      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBeGreaterThan(0);
    });

    it('should return watchlists with correct structure', () => {
      const watchlists = listWatchlists();
      const first = watchlists[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('items');
      expect(Array.isArray(first.items)).toBe(true);
    });

    it('should return watchlist items with correct structure', () => {
      const watchlists = listWatchlists();
      const firstItem = watchlists[0].items[0];

      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('createdAt');
      expect(typeof firstItem.createdAt).toBe('string');
    });

    it('should have items with either tokenId or marketId', () => {
      const watchlists = listWatchlists();
      const allItems = watchlists.flatMap((wl) => wl.items);

      allItems.forEach((item) => {
        const hasToken = item.tokenId !== undefined;
        const hasMarket = item.marketId !== undefined;
        expect(hasToken || hasMarket).toBe(true);
      });
    });
  });

  describe('getWatchlistById', () => {
    it('should return a watchlist when ID exists', () => {
      const watchlist = getWatchlistById('wl-favorites');
      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe('wl-favorites');
    });

    it('should return undefined when ID does not exist', () => {
      const watchlist = getWatchlistById('non-existent-id');
      expect(watchlist).toBeUndefined();
    });

    it('should return watchlist with correct name', () => {
      const watchlist = getWatchlistById('wl-favorites');
      expect(watchlist?.name).toBe('My Favorites');
    });

    it('should return watchlist with items array', () => {
      const watchlist = getWatchlistById('wl-favorites');
      expect(Array.isArray(watchlist?.items)).toBe(true);
      expect(watchlist?.items.length).toBeGreaterThan(0);
    });
  });

  describe('listWatchlistsWithRelations', () => {
    it('should return an array of watchlists with relations', () => {
      const watchlists = listWatchlistsWithRelations();
      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBeGreaterThan(0);
    });

    it('should enrich items with token or market data', () => {
      const watchlists = listWatchlistsWithRelations();
      const allItems = watchlists.flatMap((wl) => wl.items);

      allItems.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('createdAt');

        const hasToken = item.token !== undefined;
        const hasMarket = item.market !== undefined;
        expect(hasToken || hasMarket).toBe(true);
      });
    });

    it('should include token details when tokenId is present', () => {
      const watchlists = listWatchlistsWithRelations();
      const itemWithToken = watchlists
        .flatMap((wl) => wl.items)
        .find((item) => item.token);

      expect(itemWithToken).toBeDefined();
      expect(itemWithToken?.token).toHaveProperty('id');
      expect(itemWithToken?.token).toHaveProperty('symbol');
      expect(itemWithToken?.token).toHaveProperty('name');
      expect(itemWithToken?.token).toHaveProperty('decimals');
    });

    it('should include market details when marketId is present', () => {
      const watchlists = listWatchlistsWithRelations();
      const itemWithMarket = watchlists
        .flatMap((wl) => wl.items)
        .find((item) => item.market);

      expect(itemWithMarket).toBeDefined();
      expect(itemWithMarket?.market).toHaveProperty('id');
      expect(itemWithMarket?.market).toHaveProperty('baseToken');
      expect(itemWithMarket?.market).toHaveProperty('quoteToken');
      expect(itemWithMarket?.market?.baseToken).toHaveProperty('symbol');
      expect(itemWithMarket?.market?.quoteToken).toHaveProperty('symbol');
    });

    it('should preserve watchlist structure', () => {
      const watchlists = listWatchlistsWithRelations();
      const first = watchlists[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('items');
      expect(Array.isArray(first.items)).toBe(true);
    });
  });

  describe('getWatchlistWithRelationsById', () => {
    it('should return a watchlist with relations when ID exists', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');
      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe('wl-favorites');
    });

    it('should return undefined when ID does not exist', () => {
      const watchlist = getWatchlistWithRelationsById('non-existent-id');
      expect(watchlist).toBeUndefined();
    });

    it('should enrich items with token or market data', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');
      expect(watchlist).toBeDefined();

      watchlist?.items.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('createdAt');

        const hasToken = item.token !== undefined;
        const hasMarket = item.market !== undefined;
        expect(hasToken || hasMarket).toBe(true);
      });
    });

    it('should include complete token data for token items', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');
      const tokenItem = watchlist?.items.find((item) => item.token);

      expect(tokenItem).toBeDefined();
      expect(tokenItem?.token).toHaveProperty('id');
      expect(tokenItem?.token).toHaveProperty('symbol');
      expect(tokenItem?.token).toHaveProperty('name');
      expect(tokenItem?.token).toHaveProperty('decimals');
    });

    it('should include complete market data for market items', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');
      const marketItem = watchlist?.items.find((item) => item.market);

      expect(marketItem).toBeDefined();
      expect(marketItem?.market).toHaveProperty('id');
      expect(marketItem?.market).toHaveProperty('baseToken');
      expect(marketItem?.market).toHaveProperty('quoteToken');
      expect(marketItem?.market?.baseToken).toHaveProperty('symbol');
      expect(marketItem?.market?.quoteToken).toHaveProperty('symbol');
    });

    it('should maintain watchlist name and id', () => {
      const watchlist = getWatchlistWithRelationsById('wl-trending');
      expect(watchlist?.id).toBe('wl-trending');
      expect(watchlist?.name).toBe('Trending Markets');
    });

    it('should return items in original order', () => {
      const watchlist = getWatchlistWithRelationsById('wl-favorites');
      expect(watchlist?.items.length).toBeGreaterThan(0);

      const ids = watchlist?.items.map((item) => item.id);
      expect(ids).toEqual(['wli-1', 'wli-2', 'wli-3']);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import * as repository from '@/modules/watchlists/repository.memory';
import { DEFAULT_TEST_USER_ID } from '@/modules/watchlists/data';
import type { WatchlistUserContext } from '@/modules/watchlists/types';

// Test user context for all repository operations
const testContext: WatchlistUserContext = {
  userId: DEFAULT_TEST_USER_ID,
};

describe('watchlists repository', () => {
  beforeEach(() => {
    // Reset store before each test
    repository.resetStore();
  });

  describe('listWatchlists', () => {
    it('should return all watchlists', async () => {
      const watchlists = await repository.listWatchlists(testContext);

      expect(Array.isArray(watchlists)).toBe(true);
      expect(watchlists.length).toBeGreaterThan(0);
    });

    it('should return watchlists with correct structure', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const first = watchlists[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('items');
      expect(first).toHaveProperty('createdAt');
      expect(first).toHaveProperty('updatedAt');
      expect(Array.isArray(first.items)).toBe(true);
    });
  });

  describe('getWatchlistById', () => {
    it('should return a watchlist when ID exists', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const firstId = watchlists[0].id;

      const watchlist = await repository.getWatchlistById(testContext, firstId);

      expect(watchlist).toBeDefined();
      expect(watchlist?.id).toBe(firstId);
    });

    it('should return null when ID does not exist', async () => {
      const watchlist = await repository.getWatchlistById(testContext, 'non-existent-id');

      expect(watchlist).toBeNull();
    });
  });

  describe('createWatchlist', () => {
    it('should create a new watchlist with name only', async () => {
      const input = { name: 'Test Watchlist' };

      const watchlist = await repository.createWatchlist(testContext, input);

      expect(watchlist).toBeDefined();
      expect(watchlist.id).toBeDefined();
      expect(watchlist.name).toBe('Test Watchlist');
      expect(watchlist.description).toBeUndefined();
      expect(watchlist.items).toEqual([]);
      expect(watchlist.createdAt).toBeDefined();
      expect(watchlist.updatedAt).toBeDefined();
    });

    it('should create a new watchlist with name and description', async () => {
      const input = {
        name: 'Test Watchlist',
        description: 'This is a test watchlist',
      };

      const watchlist = await repository.createWatchlist(testContext, input);

      expect(watchlist.name).toBe('Test Watchlist');
      expect(watchlist.description).toBe('This is a test watchlist');
    });

    it('should add created watchlist to the store', async () => {
      const beforeCount = (await repository.listWatchlists(testContext)).length;

      await repository.createWatchlist(testContext, { name: 'New Watchlist' });

      const afterCount = (await repository.listWatchlists(testContext)).length;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('should generate unique IDs for each watchlist', async () => {
      const wl1 = await repository.createWatchlist(testContext, { name: 'WL 1' });
      const wl2 = await repository.createWatchlist(testContext, { name: 'WL 2' });

      expect(wl1.id).not.toBe(wl2.id);
    });
  });

  describe('updateWatchlist', () => {
    it('should update watchlist name', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      const updated = await repository.updateWatchlist(testContext, id, {
        name: 'Updated Name',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update watchlist description', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      const updated = await repository.updateWatchlist(testContext, id, {
        description: 'Updated Description',
      });

      expect(updated?.description).toBe('Updated Description');
    });

    it('should update both name and description', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      const updated = await repository.updateWatchlist(testContext, id, {
        name: 'New Name',
        description: 'New Description',
      });

      expect(updated?.name).toBe('New Name');
      expect(updated?.description).toBe('New Description');
    });

    it('should update updatedAt timestamp', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;
      const originalUpdatedAt = watchlists[0].updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await repository.updateWatchlist(testContext, id, {
        name: 'Updated',
      });

      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return null for non-existent watchlist', async () => {
      const updated = await repository.updateWatchlist(testContext, 'non-existent-id', {
        name: 'Test',
      });

      expect(updated).toBeNull();
    });
  });

  describe('addTokenToWatchlist', () => {
    it('should add a token to watchlist', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;
      const initialItemsCount = watchlists[0].items.length;

      const updated = await repository.addTokenToWatchlist(testContext, id, 'new-token-id');

      expect(updated).toBeDefined();
      expect(updated?.items.length).toBe(initialItemsCount + 1);

      const newItem = updated?.items[updated.items.length - 1];
      expect(newItem?.tokenId).toBe('new-token-id');
      expect(newItem?.id).toBeDefined();
      expect(newItem?.createdAt).toBeDefined();
    });

    it('should throw error when adding duplicate token', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      // Add token first time
      await repository.addTokenToWatchlist(testContext, id, 'duplicate-token');

      // Try to add same token again
      await expect(
        repository.addTokenToWatchlist(testContext, id, 'duplicate-token')
      ).rejects.toThrow('Token already exists in watchlist');
    });

    it('should return null for non-existent watchlist', async () => {
      const result = await repository.addTokenToWatchlist(testContext, 
        'non-existent-id',
        'token-id'
      );

      expect(result).toBeNull();
    });
  });

  describe('addMarketToWatchlist', () => {
    it('should add a market to watchlist', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;
      const initialItemsCount = watchlists[0].items.length;

      const updated = await repository.addMarketToWatchlist(testContext, 
        id,
        'new-market-id'
      );

      expect(updated).toBeDefined();
      expect(updated?.items.length).toBe(initialItemsCount + 1);

      const newItem = updated?.items[updated.items.length - 1];
      expect(newItem?.marketId).toBe('new-market-id');
      expect(newItem?.id).toBeDefined();
      expect(newItem?.createdAt).toBeDefined();
    });

    it('should throw error when adding duplicate market', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      // Add market first time
      await repository.addMarketToWatchlist(testContext, id, 'duplicate-market');

      // Try to add same market again
      await expect(
        repository.addMarketToWatchlist(testContext, id, 'duplicate-market')
      ).rejects.toThrow('Market already exists in watchlist');
    });

    it('should return null for non-existent watchlist', async () => {
      const result = await repository.addMarketToWatchlist(testContext, 
        'non-existent-id',
        'market-id'
      );

      expect(result).toBeNull();
    });
  });

  describe('removeItemFromWatchlist', () => {
    it('should remove an item from watchlist', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;
      const itemToRemove = watchlists[0].items[0];
      const initialItemsCount = watchlists[0].items.length;

      const updated = await repository.removeItemFromWatchlist(testContext, 
        id,
        itemToRemove.id
      );

      expect(updated).toBeDefined();
      expect(updated?.items.length).toBe(initialItemsCount - 1);
      expect(updated?.items.find((item) => item.id === itemToRemove.id)).toBeUndefined();
    });

    it('should throw error when removing non-existent item', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;

      await expect(
        repository.removeItemFromWatchlist(testContext, id, 'non-existent-item-id')
      ).rejects.toThrow('Item not found in watchlist');
    });

    it('should return null for non-existent watchlist', async () => {
      const result = await repository.removeItemFromWatchlist(testContext, 
        'non-existent-id',
        'item-id'
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteWatchlist', () => {
    it('should delete a watchlist', async () => {
      const watchlists = await repository.listWatchlists(testContext);
      const id = watchlists[0].id;
      const initialCount = watchlists.length;

      await repository.deleteWatchlist(testContext, id);

      const afterDelete = await repository.listWatchlists(testContext);
      expect(afterDelete.length).toBe(initialCount - 1);
      expect(afterDelete.find((wl) => wl.id === id)).toBeUndefined();
    });

    it('should throw error when deleting non-existent watchlist', async () => {
      await expect(
        repository.deleteWatchlist(testContext, 'non-existent-id')
      ).rejects.toThrow('Watchlist not found');
    });
  });

  describe('resetStore', () => {
    it('should reset store to initial data', async () => {
      // Create a new watchlist
      await repository.createWatchlist(testContext, { name: 'Temporary' });

      const beforeReset = await repository.listWatchlists(testContext);
      const beforeCount = beforeReset.length;

      // Reset store
      repository.resetStore();

      const afterReset = await repository.listWatchlists(testContext);

      // Should have fewer watchlists (the temp one removed)
      expect(afterReset.length).toBeLessThan(beforeCount);
    });
  });
});

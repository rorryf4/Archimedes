import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemorySavedOpportunityViewRepository } from '../../modules/opportunities/savedViews.repository.memory';
import type { CreateSavedOpportunityViewInput } from '../../modules/opportunities/savedViews.types';

describe('savedViews.repository.memory', () => {
  const repo = createInMemorySavedOpportunityViewRepository();

  beforeEach(() => {
    repo.reset();
  });

  const userA = 'user-a';
  const userB = 'user-b';

  const createInput: CreateSavedOpportunityViewInput = {
    name: 'My View',
    params: {
      minSeverity: 'watch',
      signalKeys: ['volume_burst'],
      watchlistId: null,
    },
  };

  describe('createForUser', () => {
    it('should create a view for a user', async () => {
      const view = await repo.createForUser(userA, createInput);

      expect(view.id).toMatch(/^sov-/);
      expect(view.userId).toBe(userA);
      expect(view.name).toBe('My View');
      expect(view.params.minSeverity).toBe('watch');
      expect(view.params.signalKeys).toEqual(['volume_burst']);
      expect(view.params.watchlistId).toBeNull();
      expect(view.createdAt).toBeInstanceOf(Date);
      expect(view.updatedAt).toBeInstanceOf(Date);
    });

    it('should create multiple views for the same user', async () => {
      await repo.createForUser(userA, createInput);
      await repo.createForUser(userA, {
        name: 'Another View',
        params: {
          minSeverity: 'action',
          signalKeys: [],
          watchlistId: 'wl-123',
        },
      });

      const views = await repo.listForUser(userA);
      expect(views).toHaveLength(2);
    });
  });

  describe('listForUser', () => {
    it('should return empty array when no views exist', async () => {
      const views = await repo.listForUser(userA);
      expect(views).toEqual([]);
    });

    it('should return views sorted by updatedAt descending', async () => {
      const view1 = await repo.createForUser(userA, {
        name: 'First',
        params: { minSeverity: 'info', signalKeys: [], watchlistId: null },
      });

      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));

      const view2 = await repo.createForUser(userA, {
        name: 'Second',
        params: { minSeverity: 'watch', signalKeys: [], watchlistId: null },
      });

      const views = await repo.listForUser(userA);

      expect(views).toHaveLength(2);
      // Most recently created (view2) should be first
      expect(views[0].id).toBe(view2.id);
      expect(views[1].id).toBe(view1.id);
    });

    it('should reflect updated order after update', async () => {
      const view1 = await repo.createForUser(userA, {
        name: 'First',
        params: { minSeverity: 'info', signalKeys: [], watchlistId: null },
      });

      await new Promise((r) => setTimeout(r, 10));

      const view2 = await repo.createForUser(userA, {
        name: 'Second',
        params: { minSeverity: 'watch', signalKeys: [], watchlistId: null },
      });

      // Update view1 to make it most recent
      await new Promise((r) => setTimeout(r, 10));
      await repo.updateForUser(userA, view1.id, { name: 'Updated First' });

      const views = await repo.listForUser(userA);

      expect(views).toHaveLength(2);
      // Updated view1 should now be first
      expect(views[0].name).toBe('Updated First');
      expect(views[1].id).toBe(view2.id);
    });

    it('should only return views for the specified user (cross-user isolation)', async () => {
      await repo.createForUser(userA, {
        name: 'User A View',
        params: { minSeverity: 'info', signalKeys: [], watchlistId: null },
      });

      await repo.createForUser(userB, {
        name: 'User B View',
        params: { minSeverity: 'watch', signalKeys: [], watchlistId: null },
      });

      const viewsA = await repo.listForUser(userA);
      const viewsB = await repo.listForUser(userB);

      expect(viewsA).toHaveLength(1);
      expect(viewsA[0].name).toBe('User A View');

      expect(viewsB).toHaveLength(1);
      expect(viewsB[0].name).toBe('User B View');
    });
  });

  describe('getById', () => {
    it('should return the view if it belongs to the user', async () => {
      const created = await repo.createForUser(userA, createInput);

      const found = await repo.getById(userA, created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('My View');
    });

    it('should return null if view does not exist', async () => {
      const found = await repo.getById(userA, 'non-existent-id');
      expect(found).toBeNull();
    });

    it('should return null if view belongs to different user', async () => {
      const created = await repo.createForUser(userA, createInput);

      const found = await repo.getById(userB, created.id);
      expect(found).toBeNull();
    });
  });

  describe('updateForUser', () => {
    it('should update name only', async () => {
      const created = await repo.createForUser(userA, createInput);
      const originalUpdatedAt = created.updatedAt;

      await new Promise((r) => setTimeout(r, 10));

      const updated = await repo.updateForUser(userA, created.id, {
        name: 'Updated Name',
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.params).toEqual(created.params);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should update params partially', async () => {
      const created = await repo.createForUser(userA, createInput);

      const updated = await repo.updateForUser(userA, created.id, {
        params: { minSeverity: 'action' },
      });

      expect(updated).not.toBeNull();
      expect(updated?.params.minSeverity).toBe('action');
      expect(updated?.params.signalKeys).toEqual(['volume_burst']); // unchanged
      expect(updated?.params.watchlistId).toBeNull(); // unchanged
    });

    it('should update params.watchlistId to a new value', async () => {
      const created = await repo.createForUser(userA, createInput);

      const updated = await repo.updateForUser(userA, created.id, {
        params: { watchlistId: 'wl-new' },
      });

      expect(updated?.params.watchlistId).toBe('wl-new');
    });

    it('should return null if view does not exist', async () => {
      const updated = await repo.updateForUser(userA, 'non-existent', {
        name: 'New Name',
      });
      expect(updated).toBeNull();
    });

    it('should return null if view belongs to different user', async () => {
      const created = await repo.createForUser(userA, createInput);

      const updated = await repo.updateForUser(userB, created.id, {
        name: 'Hacked Name',
      });

      expect(updated).toBeNull();

      // Original should be unchanged
      const original = await repo.getById(userA, created.id);
      expect(original?.name).toBe('My View');
    });
  });

  describe('deleteForUser', () => {
    it('should delete a view and return true', async () => {
      const created = await repo.createForUser(userA, createInput);

      const deleted = await repo.deleteForUser(userA, created.id);

      expect(deleted).toBe(true);

      const found = await repo.getById(userA, created.id);
      expect(found).toBeNull();
    });

    it('should return false if view does not exist', async () => {
      const deleted = await repo.deleteForUser(userA, 'non-existent');
      expect(deleted).toBe(false);
    });

    it('should return false if view belongs to different user', async () => {
      const created = await repo.createForUser(userA, createInput);

      const deleted = await repo.deleteForUser(userB, created.id);

      expect(deleted).toBe(false);

      // Original should still exist
      const found = await repo.getById(userA, created.id);
      expect(found).not.toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all data', async () => {
      await repo.createForUser(userA, createInput);
      await repo.createForUser(userB, createInput);

      repo.reset();

      const viewsA = await repo.listForUser(userA);
      const viewsB = await repo.listForUser(userB);

      expect(viewsA).toEqual([]);
      expect(viewsB).toEqual([]);
    });
  });
});

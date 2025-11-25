import { describe, it, expect, beforeEach } from 'vitest';
import {
  listSavedOpportunityViewsForCurrentUser,
  getSavedOpportunityViewForCurrentUser,
  createSavedOpportunityViewForCurrentUser,
  updateSavedOpportunityViewForCurrentUser,
  deleteSavedOpportunityViewForCurrentUser,
  duplicateSavedOpportunityViewForCurrentUser,
  resetSavedOpportunityViewsRepository,
} from '../../modules/opportunities/savedViews.service';
import type { CreateSavedOpportunityViewInput } from '../../modules/opportunities/savedViews.types';

// The service uses getCurrentUserContext() which returns DEFAULT_TEST_USER_ID
// All operations will be scoped to that user

describe('savedViews.service', () => {
  beforeEach(() => {
    resetSavedOpportunityViewsRepository();
  });

  const createInput: CreateSavedOpportunityViewInput = {
    name: 'My Saved View',
    params: {
      minSeverity: 'watch',
      signalKeys: ['volume_burst', 'price_spike'],
      watchlistId: 'wl-123',
    },
  };

  describe('listSavedOpportunityViewsForCurrentUser', () => {
    it('should return empty array when no views exist', async () => {
      const views = await listSavedOpportunityViewsForCurrentUser();
      expect(views).toEqual([]);
    });

    it('should return views sorted by updatedAt descending', async () => {
      const view1 = await createSavedOpportunityViewForCurrentUser(createInput);

      await new Promise((r) => setTimeout(r, 10));

      await createSavedOpportunityViewForCurrentUser({
        name: 'Second View',
        params: {
          minSeverity: 'action',
          signalKeys: [],
          watchlistId: null,
        },
      });

      // Update the first view to make it more recent
      await new Promise((r) => setTimeout(r, 10));
      await updateSavedOpportunityViewForCurrentUser(view1.id, {
        name: 'Updated First View',
      });

      const views = await listSavedOpportunityViewsForCurrentUser();

      expect(views).toHaveLength(2);
      // First view should be first because it was updated most recently
      expect(views[0].name).toBe('Updated First View');
      expect(views[1].name).toBe('Second View');
    });
  });

  describe('createSavedOpportunityViewForCurrentUser', () => {
    it('should create a view with all fields populated', async () => {
      const view = await createSavedOpportunityViewForCurrentUser(createInput);

      expect(view.id).toMatch(/^sov-/);
      expect(view.name).toBe('My Saved View');
      expect(view.params.minSeverity).toBe('watch');
      expect(view.params.signalKeys).toEqual(['volume_burst', 'price_spike']);
      expect(view.params.watchlistId).toBe('wl-123');
      expect(view.createdAt).toBeInstanceOf(Date);
      expect(view.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a view with null watchlistId', async () => {
      const view = await createSavedOpportunityViewForCurrentUser({
        name: 'All Watchlists View',
        params: {
          minSeverity: 'info',
          signalKeys: [],
          watchlistId: null,
        },
      });

      expect(view.params.watchlistId).toBeNull();
    });
  });

  describe('getSavedOpportunityViewForCurrentUser', () => {
    it('should return the view if it exists', async () => {
      const created = await createSavedOpportunityViewForCurrentUser(createInput);

      const found = await getSavedOpportunityViewForCurrentUser(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('My Saved View');
    });

    it('should return null if view does not exist', async () => {
      const found = await getSavedOpportunityViewForCurrentUser('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('updateSavedOpportunityViewForCurrentUser', () => {
    it('should update the view name', async () => {
      const created = await createSavedOpportunityViewForCurrentUser(createInput);

      const updated = await updateSavedOpportunityViewForCurrentUser(
        created.id,
        { name: 'Updated Name' }
      );

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.params).toEqual(created.params);
    });

    it('should update params partially', async () => {
      const created = await createSavedOpportunityViewForCurrentUser(createInput);

      const updated = await updateSavedOpportunityViewForCurrentUser(
        created.id,
        { params: { minSeverity: 'action' } }
      );

      expect(updated?.params.minSeverity).toBe('action');
      expect(updated?.params.signalKeys).toEqual(['volume_burst', 'price_spike']);
      expect(updated?.params.watchlistId).toBe('wl-123');
    });

    it('should return null if view does not exist', async () => {
      const updated = await updateSavedOpportunityViewForCurrentUser(
        'non-existent',
        { name: 'New Name' }
      );
      expect(updated).toBeNull();
    });
  });

  describe('deleteSavedOpportunityViewForCurrentUser', () => {
    it('should delete the view and return true', async () => {
      const created = await createSavedOpportunityViewForCurrentUser(createInput);

      const deleted = await deleteSavedOpportunityViewForCurrentUser(created.id);

      expect(deleted).toBe(true);

      const found = await getSavedOpportunityViewForCurrentUser(created.id);
      expect(found).toBeNull();
    });

    it('should return false if view does not exist', async () => {
      const deleted = await deleteSavedOpportunityViewForCurrentUser('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('duplicateSavedOpportunityViewForCurrentUser', () => {
    it('should duplicate an existing view with (Copy) suffix', async () => {
      const original = await createSavedOpportunityViewForCurrentUser(createInput);

      const duplicate = await duplicateSavedOpportunityViewForCurrentUser(original.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.name).toBe('My Saved View (Copy)');
      expect(duplicate?.params.minSeverity).toBe(original.params.minSeverity);
      expect(duplicate?.params.signalKeys).toEqual(original.params.signalKeys);
      expect(duplicate?.params.watchlistId).toBe(original.params.watchlistId);
    });

    it('should return null if original view does not exist', async () => {
      const duplicate = await duplicateSavedOpportunityViewForCurrentUser('non-existent');
      expect(duplicate).toBeNull();
    });

    it('should create an independent copy', async () => {
      const original = await createSavedOpportunityViewForCurrentUser(createInput);
      const duplicate = await duplicateSavedOpportunityViewForCurrentUser(original.id);

      // Update the duplicate
      await updateSavedOpportunityViewForCurrentUser(duplicate!.id, {
        name: 'Modified Copy',
      });

      // Original should be unchanged
      const refetchedOriginal = await getSavedOpportunityViewForCurrentUser(original.id);
      expect(refetchedOriginal?.name).toBe('My Saved View');
    });
  });

  describe('user scoping', () => {
    it('should only return views for the current user', async () => {
      // Create a view for the current user
      await createSavedOpportunityViewForCurrentUser(createInput);

      // The service always uses the same test user (DEFAULT_TEST_USER_ID)
      // so all views created will be for that user
      const views = await listSavedOpportunityViewsForCurrentUser();

      expect(views).toHaveLength(1);
      expect(views[0].name).toBe('My Saved View');
    });

    it('should not be able to access views from other users', async () => {
      // Since getCurrentUserContext always returns DEFAULT_TEST_USER_ID,
      // we can't directly test cross-user isolation at the service level.
      // That isolation is tested in the repository tests.
      // Here we verify the service correctly passes the user context.

      const view = await createSavedOpportunityViewForCurrentUser(createInput);

      // The view should have the current user's ID
      expect(view.userId).toBeDefined();
      expect(typeof view.userId).toBe('string');
    });
  });
});

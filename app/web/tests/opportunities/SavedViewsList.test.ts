import { describe, it, expect } from 'vitest';
import type { SavedOpportunityView } from '../../modules/opportunities/savedViews.types';
import { buildSavedViewHref } from '../../components/opportunities/SavedViewsList';

function createSavedView(
  overrides: Partial<SavedOpportunityView> = {}
): SavedOpportunityView {
  return {
    id: 'sov-123',
    userId: 'user-1',
    name: 'Test View',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    params: {
      minSeverity: 'info',
      signalKeys: [],
      watchlistId: null,
    },
    ...overrides,
  };
}

describe('SavedViewsList', () => {
  describe('buildSavedViewHref', () => {
    it('should build href with viewId parameter', () => {
      const view = createSavedView({
        id: 'view-abc-123',
        params: {
          minSeverity: 'watch',
          signalKeys: [],
          watchlistId: null,
        },
      });

      const href = buildSavedViewHref(view);

      expect(href).toBe('/opportunities?viewId=view-abc-123');
    });

    it('should build href with viewId for complex params', () => {
      const view = createSavedView({
        id: 'view-456',
        params: {
          minSeverity: 'action',
          signalKeys: ['volume_burst', 'price_spike'],
          watchlistId: 'wl-favorites',
        },
      });

      const href = buildSavedViewHref(view);

      expect(href).toBe('/opportunities?viewId=view-456');
    });

    it('should use viewId regardless of param values', () => {
      const view = createSavedView({
        id: 'sov-999',
        params: {
          minSeverity: 'info',
          signalKeys: [],
          watchlistId: null,
        },
      });

      const href = buildSavedViewHref(view);

      expect(href).toBe('/opportunities?viewId=sov-999');
    });

    it('should handle views with different IDs', () => {
      const view1 = createSavedView({ id: 'view-1' });
      const view2 = createSavedView({ id: 'view-2' });

      const href1 = buildSavedViewHref(view1);
      const href2 = buildSavedViewHref(view2);

      expect(href1).toBe('/opportunities?viewId=view-1');
      expect(href2).toBe('/opportunities?viewId=view-2');
      expect(href1).not.toBe(href2);
    });
  });
});

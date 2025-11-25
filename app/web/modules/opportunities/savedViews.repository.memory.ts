import type {
  SavedOpportunityView,
  CreateSavedOpportunityViewInput,
  UpdateSavedOpportunityViewInput,
} from './savedViews.types';

export interface SavedOpportunityViewRepository {
  listForUser(userId: string): Promise<SavedOpportunityView[]>;
  getById(userId: string, id: string): Promise<SavedOpportunityView | null>;
  createForUser(
    userId: string,
    input: CreateSavedOpportunityViewInput
  ): Promise<SavedOpportunityView>;
  updateForUser(
    userId: string,
    id: string,
    patch: UpdateSavedOpportunityViewInput
  ): Promise<SavedOpportunityView | null>;
  deleteForUser(userId: string, id: string): Promise<boolean>;
  reset(): void;
}

function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `sov-${timestamp}-${random}`;
}

export function createInMemorySavedOpportunityViewRepository(): SavedOpportunityViewRepository {
  const store = new Map<string, SavedOpportunityView[]>();

  function getViewsForUser(userId: string): SavedOpportunityView[] {
    return store.get(userId) ?? [];
  }

  function setViewsForUser(userId: string, views: SavedOpportunityView[]): void {
    store.set(userId, views);
  }

  return {
    async listForUser(userId: string): Promise<SavedOpportunityView[]> {
      const views = getViewsForUser(userId);
      // Return sorted by updatedAt descending (most recently updated first)
      return [...views].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    },

    async getById(
      userId: string,
      id: string
    ): Promise<SavedOpportunityView | null> {
      const views = getViewsForUser(userId);
      return views.find((v) => v.id === id) ?? null;
    },

    async createForUser(
      userId: string,
      input: CreateSavedOpportunityViewInput
    ): Promise<SavedOpportunityView> {
      const now = new Date();
      const newView: SavedOpportunityView = {
        id: generateId(),
        userId,
        name: input.name,
        createdAt: now,
        updatedAt: now,
        params: {
          minSeverity: input.params.minSeverity,
          signalKeys: [...input.params.signalKeys],
          watchlistId: input.params.watchlistId,
        },
      };

      const views = getViewsForUser(userId);
      setViewsForUser(userId, [...views, newView]);

      return newView;
    },

    async updateForUser(
      userId: string,
      id: string,
      patch: UpdateSavedOpportunityViewInput
    ): Promise<SavedOpportunityView | null> {
      const views = getViewsForUser(userId);
      const index = views.findIndex((v) => v.id === id);

      if (index === -1) {
        return null;
      }

      const existing = views[index];
      const updatedParams = patch.params
        ? {
            minSeverity: patch.params.minSeverity ?? existing.params.minSeverity,
            signalKeys: patch.params.signalKeys ?? existing.params.signalKeys,
            watchlistId:
              patch.params.watchlistId !== undefined
                ? patch.params.watchlistId
                : existing.params.watchlistId,
          }
        : existing.params;

      const updated: SavedOpportunityView = {
        ...existing,
        name: patch.name ?? existing.name,
        params: updatedParams,
        updatedAt: new Date(),
      };

      const newViews = [...views];
      newViews[index] = updated;
      setViewsForUser(userId, newViews);

      return updated;
    },

    async deleteForUser(userId: string, id: string): Promise<boolean> {
      const views = getViewsForUser(userId);
      const index = views.findIndex((v) => v.id === id);

      if (index === -1) {
        return false;
      }

      const newViews = views.filter((v) => v.id !== id);
      setViewsForUser(userId, newViews);

      return true;
    },

    reset(): void {
      store.clear();
    },
  };
}

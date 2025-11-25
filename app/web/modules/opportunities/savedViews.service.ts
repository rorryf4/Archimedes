import { getCurrentUserContext } from '../watchlists/data';
import {
  createInMemorySavedOpportunityViewRepository,
  type SavedOpportunityViewRepository,
} from './savedViews.repository.memory';
import type {
  SavedOpportunityView,
  CreateSavedOpportunityViewInput,
  UpdateSavedOpportunityViewInput,
} from './savedViews.types';

// Singleton repository instance
let repository: SavedOpportunityViewRepository | null = null;

function getRepository(): SavedOpportunityViewRepository {
  if (!repository) {
    repository = createInMemorySavedOpportunityViewRepository();
  }
  return repository;
}

export async function listSavedOpportunityViewsForCurrentUser(): Promise<
  SavedOpportunityView[]
> {
  const { userId } = getCurrentUserContext();
  return getRepository().listForUser(userId);
}

export async function getSavedOpportunityViewForCurrentUser(
  id: string
): Promise<SavedOpportunityView | null> {
  const { userId } = getCurrentUserContext();
  return getRepository().getById(userId, id);
}

export async function createSavedOpportunityViewForCurrentUser(
  input: CreateSavedOpportunityViewInput
): Promise<SavedOpportunityView> {
  const { userId } = getCurrentUserContext();
  return getRepository().createForUser(userId, input);
}

export async function updateSavedOpportunityViewForCurrentUser(
  id: string,
  patch: UpdateSavedOpportunityViewInput
): Promise<SavedOpportunityView | null> {
  const { userId } = getCurrentUserContext();
  return getRepository().updateForUser(userId, id, patch);
}

export async function deleteSavedOpportunityViewForCurrentUser(
  id: string
): Promise<boolean> {
  const { userId } = getCurrentUserContext();
  return getRepository().deleteForUser(userId, id);
}

/**
 * Duplicate an existing saved view for the current user.
 * Creates a new view with identical params and name "<originalName> (Copy)".
 * Returns null if the original view is not found.
 */
export async function duplicateSavedOpportunityViewForCurrentUser(
  id: string
): Promise<SavedOpportunityView | null> {
  const { userId } = getCurrentUserContext();
  const repo = getRepository();

  const original = await repo.getById(userId, id);
  if (!original) {
    return null;
  }

  const duplicateInput: CreateSavedOpportunityViewInput = {
    name: `${original.name} (Copy)`,
    params: {
      minSeverity: original.params.minSeverity,
      signalKeys: [...original.params.signalKeys],
      watchlistId: original.params.watchlistId,
    },
  };

  return repo.createForUser(userId, duplicateInput);
}

/**
 * Reset the repository (for testing)
 */
export function resetSavedOpportunityViewsRepository(): void {
  if (repository) {
    repository.reset();
  }
}

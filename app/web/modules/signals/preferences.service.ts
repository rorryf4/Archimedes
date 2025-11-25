import { getCurrentUserContext } from '../watchlists/data';
import {
  createInMemoryUserSignalPreferencesRepository,
  type UserSignalPreferencesRepository,
} from './preferences.repository.memory';
import type {
  UserSignalPreferences,
  UpdateUserSignalPreferencesInput,
} from './preferences.types';

// Singleton repository instance
let repository: UserSignalPreferencesRepository | null = null;

function getRepository(): UserSignalPreferencesRepository {
  if (!repository) {
    repository = createInMemoryUserSignalPreferencesRepository();
  }
  return repository;
}

/**
 * Get signal preferences for the current user.
 * Returns null if no preferences have been set.
 */
export async function getCurrentUserSignalPreferences(): Promise<UserSignalPreferences | null> {
  const { userId } = getCurrentUserContext();
  return getRepository().getForUser(userId);
}

/**
 * Get or initialize signal preferences for the current user.
 * If no preferences exist, creates a default set with 'info' as the default min severity.
 */
export async function getOrInitializeCurrentUserSignalPreferences(): Promise<UserSignalPreferences> {
  const existing = await getCurrentUserSignalPreferences();
  if (existing) {
    return existing;
  }

  // Initialize with defaults
  const { userId } = getCurrentUserContext();
  return getRepository().setForUser(userId, {
    defaultMinSeverity: 'info',
    signalPreferences: [],
  });
}

/**
 * Update signal preferences for the current user.
 * Merges the input with existing preferences.
 */
export async function updateCurrentUserSignalPreferences(
  input: UpdateUserSignalPreferencesInput
): Promise<UserSignalPreferences> {
  const { userId } = getCurrentUserContext();
  return getRepository().setForUser(userId, input);
}

/**
 * Reset the repository (for testing)
 */
export function resetUserSignalPreferencesRepository(): void {
  if (repository) {
    repository.reset();
  }
}

import type {
  UserSignalPreferences,
  UpdateUserSignalPreferencesInput,
} from './preferences.types';

export interface UserSignalPreferencesRepository {
  getForUser(userId: string): Promise<UserSignalPreferences | null>;
  setForUser(
    userId: string,
    input: UpdateUserSignalPreferencesInput
  ): Promise<UserSignalPreferences>;
  reset(): void;
}

export function createInMemoryUserSignalPreferencesRepository(): UserSignalPreferencesRepository {
  const store = new Map<string, UserSignalPreferences>();

  return {
    async getForUser(userId: string): Promise<UserSignalPreferences | null> {
      return store.get(userId) ?? null;
    },

    async setForUser(
      userId: string,
      input: UpdateUserSignalPreferencesInput
    ): Promise<UserSignalPreferences> {
      const existing = store.get(userId);
      const now = new Date();

      const preferences: UserSignalPreferences = {
        userId,
        defaultMinSeverity: input.defaultMinSeverity ?? existing?.defaultMinSeverity ?? 'info',
        signalPreferences: input.signalPreferences ?? existing?.signalPreferences ?? [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      store.set(userId, preferences);
      return preferences;
    },

    reset(): void {
      store.clear();
    },
  };
}

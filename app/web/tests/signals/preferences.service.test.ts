import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCurrentUserSignalPreferences,
  getOrInitializeCurrentUserSignalPreferences,
  updateCurrentUserSignalPreferences,
  resetUserSignalPreferencesRepository,
} from '../../modules/signals/preferences.service';
import type { SignalSeverity } from '../../modules/signals/types';

describe('Signal Preferences Service', () => {
  beforeEach(() => {
    resetUserSignalPreferencesRepository();
  });

  describe('getCurrentUserSignalPreferences', () => {
    it('should return null when no preferences exist', async () => {
      const preferences = await getCurrentUserSignalPreferences();
      expect(preferences).toBeNull();
    });

    it('should return preferences after they are created', async () => {
      await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'watch',
        signalPreferences: [],
      });

      const preferences = await getCurrentUserSignalPreferences();
      expect(preferences).not.toBeNull();
      expect(preferences?.defaultMinSeverity).toBe('watch');
    });
  });

  describe('getOrInitializeCurrentUserSignalPreferences', () => {
    it('should initialize preferences with defaults when none exist', async () => {
      const preferences = await getOrInitializeCurrentUserSignalPreferences();

      expect(preferences).not.toBeNull();
      expect(preferences.defaultMinSeverity).toBe('info');
      expect(preferences.signalPreferences).toEqual([]);
      expect(preferences.userId).toBeDefined();
      expect(preferences.createdAt).toBeDefined();
      expect(preferences.updatedAt).toBeDefined();
    });

    it('should return existing preferences when they exist', async () => {
      // Create initial preferences
      await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'action',
        signalPreferences: [{ signalId: 'volume_burst', enabled: false, minSeverity: null }],
      });

      const preferences = await getOrInitializeCurrentUserSignalPreferences();

      expect(preferences.defaultMinSeverity).toBe('action');
      expect(preferences.signalPreferences).toHaveLength(1);
      expect(preferences.signalPreferences[0].signalId).toBe('volume_burst');
    });
  });

  describe('updateCurrentUserSignalPreferences', () => {
    it('should create new preferences with specified values', async () => {
      const preferences = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'watch',
        signalPreferences: [
          { signalId: 'volume_burst', enabled: false, minSeverity: null },
          { signalId: 'price_spike', enabled: true, minSeverity: 'action' },
        ],
      });

      expect(preferences.defaultMinSeverity).toBe('watch');
      expect(preferences.signalPreferences).toHaveLength(2);
      expect(preferences.signalPreferences[0].signalId).toBe('volume_burst');
      expect(preferences.signalPreferences[0].enabled).toBe(false);
      expect(preferences.signalPreferences[1].signalId).toBe('price_spike');
      expect(preferences.signalPreferences[1].enabled).toBe(true);
    });

    it('should update existing preferences', async () => {
      // Create initial preferences
      await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'info',
        signalPreferences: [],
      });

      // Update preferences
      const updated = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'action',
        signalPreferences: [{ signalId: 'volume_burst', enabled: false, minSeverity: null }],
      });

      expect(updated.defaultMinSeverity).toBe('action');
      expect(updated.signalPreferences).toHaveLength(1);
    });

    it('should merge updates with existing preferences', async () => {
      // Create initial preferences
      const initial = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'info',
        signalPreferences: [{ signalId: 'volume_burst', enabled: false, minSeverity: null }],
      });

      // Update only defaultMinSeverity
      const updated = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'watch',
      });

      expect(updated.defaultMinSeverity).toBe('watch');
      expect(updated.signalPreferences).toHaveLength(1);
      expect(updated.signalPreferences[0].signalId).toBe('volume_burst');
      expect(updated.createdAt).toEqual(initial.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(initial.updatedAt.getTime());
    });

    it('should handle all severity levels', async () => {
      const severities: SignalSeverity[] = ['none', 'info', 'watch', 'action'];

      for (const severity of severities) {
        const preferences = await updateCurrentUserSignalPreferences({
          defaultMinSeverity: severity,
        });

        expect(preferences.defaultMinSeverity).toBe(severity);
      }
    });

    it('should handle empty signal preferences list', async () => {
      const preferences = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'info',
        signalPreferences: [],
      });

      expect(preferences.signalPreferences).toEqual([]);
    });

    it('should handle multiple disabled signals', async () => {
      const preferences = await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'info',
        signalPreferences: [
          { signalId: 'signal1', enabled: false, minSeverity: null },
          { signalId: 'signal2', enabled: false, minSeverity: null },
          { signalId: 'signal3', enabled: true, minSeverity: null },
        ],
      });

      expect(preferences.signalPreferences).toHaveLength(3);
      const disabled = preferences.signalPreferences.filter((p) => !p.enabled);
      expect(disabled).toHaveLength(2);
    });
  });

  describe('resetUserSignalPreferencesRepository', () => {
    it('should clear all preferences', async () => {
      await updateCurrentUserSignalPreferences({
        defaultMinSeverity: 'watch',
        signalPreferences: [],
      });

      resetUserSignalPreferencesRepository();

      const preferences = await getCurrentUserSignalPreferences();
      expect(preferences).toBeNull();
    });
  });
});

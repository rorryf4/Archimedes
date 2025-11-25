import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  shouldTriggerAlert,
  recordAlertTrigger,
  clearDedupingState,
  getCooldownMs,
} from '../../modules/alerts/deduping';

describe('Alert Deduping', () => {
  beforeEach(() => {
    clearDedupingState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('shouldTriggerAlert', () => {
    it('should return true for first trigger', () => {
      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(true);
    });

    it('should return false immediately after trigger within cooldown', () => {
      shouldTriggerAlert('alert-1', 'opp-1');
      recordAlertTrigger('alert-1', 'opp-1');

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);
    });

    it('should return false within cooldown period', () => {
      shouldTriggerAlert('alert-1', 'opp-1');
      recordAlertTrigger('alert-1', 'opp-1');

      // Advance time by 4 minutes (still within 5-minute cooldown)
      vi.advanceTimersByTime(4 * 60 * 1000);

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);
    });

    it('should return true after cooldown period elapses', () => {
      shouldTriggerAlert('alert-1', 'opp-1');
      recordAlertTrigger('alert-1', 'opp-1');

      // Advance time by exactly 5 minutes
      vi.advanceTimersByTime(getCooldownMs());

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(true);
    });

    it('should track different alert-opportunity pairs independently', () => {
      recordAlertTrigger('alert-1', 'opp-1');
      recordAlertTrigger('alert-1', 'opp-2');

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);
      expect(shouldTriggerAlert('alert-1', 'opp-2')).toBe(false);
      expect(shouldTriggerAlert('alert-2', 'opp-1')).toBe(true); // Different alert
      expect(shouldTriggerAlert('alert-1', 'opp-3')).toBe(true); // Different opportunity
    });

    it('should allow re-triggering after cooldown for same pair', () => {
      // First trigger
      recordAlertTrigger('alert-1', 'opp-1');
      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);

      // Advance past cooldown
      vi.advanceTimersByTime(getCooldownMs() + 1000);
      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(true);

      // Second trigger
      recordAlertTrigger('alert-1', 'opp-1');
      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);
    });
  });

  describe('clearDedupingState', () => {
    it('should clear all deduping state', () => {
      recordAlertTrigger('alert-1', 'opp-1');
      recordAlertTrigger('alert-2', 'opp-2');

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(false);
      expect(shouldTriggerAlert('alert-2', 'opp-2')).toBe(false);

      clearDedupingState();

      expect(shouldTriggerAlert('alert-1', 'opp-1')).toBe(true);
      expect(shouldTriggerAlert('alert-2', 'opp-2')).toBe(true);
    });
  });

  describe('getCooldownMs', () => {
    it('should return 5 minutes in milliseconds', () => {
      expect(getCooldownMs()).toBe(5 * 60 * 1000);
    });
  });
});

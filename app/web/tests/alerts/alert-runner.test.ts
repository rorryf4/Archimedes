import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startAlertRunner,
  stopAlertRunner,
  isAlertRunnerActive,
  runAlertEvaluationOnce,
} from '../../app/internal/alert-runner';
import { clearAllAlerts } from '../../modules/alerts/repository.memory';
import { clearAllTriggeredAlertEvents } from '../../modules/alerts/events.repository.memory';
import { clearDedupingState } from '../../modules/alerts/deduping';

// Mock dependencies
vi.mock('../../modules/opportunities/service', () => ({
  listOpportunities: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../modules/watchlists/data', () => ({
  getCurrentUserContext: vi.fn(() => ({ userId: 'test-user' })),
}));

describe('Alert Runner', () => {
  beforeEach(() => {
    clearAllAlerts();
    clearAllTriggeredAlertEvents();
    clearDedupingState();
    stopAlertRunner(); // Ensure clean state
  });

  afterEach(() => {
    stopAlertRunner();
  });

  describe('startAlertRunner', () => {
    it('should start the alert runner', () => {
      expect(isAlertRunnerActive()).toBe(false);
      startAlertRunner();
      expect(isAlertRunnerActive()).toBe(true);
    });

    it('should not start multiple instances', () => {
      startAlertRunner();
      expect(isAlertRunnerActive()).toBe(true);

      // Try to start again
      startAlertRunner();
      expect(isAlertRunnerActive()).toBe(true);
    });
  });

  describe('stopAlertRunner', () => {
    it('should stop the alert runner', () => {
      startAlertRunner();
      expect(isAlertRunnerActive()).toBe(true);

      stopAlertRunner();
      expect(isAlertRunnerActive()).toBe(false);
    });

    it('should handle stopping when not running', () => {
      expect(isAlertRunnerActive()).toBe(false);
      stopAlertRunner(); // Should not throw
      expect(isAlertRunnerActive()).toBe(false);
    });
  });

  describe('runAlertEvaluationOnce', () => {
    it('should return count of triggered events', async () => {
      const count = await runAlertEvaluationOnce();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should work when no opportunities exist', async () => {
      const count = await runAlertEvaluationOnce();
      expect(count).toBe(0);
    });
  });

  describe('isAlertRunnerActive', () => {
    it('should return false when not started', () => {
      expect(isAlertRunnerActive()).toBe(false);
    });

    it('should return true when started', () => {
      startAlertRunner();
      expect(isAlertRunnerActive()).toBe(true);
    });

    it('should return false after stopped', () => {
      startAlertRunner();
      stopAlertRunner();
      expect(isAlertRunnerActive()).toBe(false);
    });
  });
});

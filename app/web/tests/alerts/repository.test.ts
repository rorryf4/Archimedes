import { describe, it, expect, beforeEach } from 'vitest';
import {
  listAlertsForUser,
  getAlertForUser,
  createAlertForUser,
  updateAlertForUser,
  deleteAlertForUser,
  clearAllAlerts,
} from '../../modules/alerts/repository.memory';
import type { CreateAlertInput } from '../../modules/alerts/types';

describe('Alert Repository', () => {
  beforeEach(() => {
    clearAllAlerts();
  });

  describe('createAlertForUser', () => {
    it('should create a signal-threshold alert', () => {
      const input: CreateAlertInput = {
        kind: 'signal-threshold',
        name: 'High Volume Alert',
        signalId: 'volume_burst',
        minSeverity: 'action',
      };

      const alert = createAlertForUser('user-1', input);

      expect(alert.id).toBeDefined();
      expect(alert.userId).toBe('user-1');
      expect(alert.kind).toBe('signal-threshold');
      expect(alert.name).toBe('High Volume Alert');
      expect(alert.enabled).toBe(true);
      expect(alert.createdAt).toBeDefined();
      expect(alert.updatedAt).toBeDefined();

      if (alert.kind === 'signal-threshold') {
        expect(alert.signalId).toBe('volume_burst');
        expect(alert.minSeverity).toBe('action');
      }
    });

    it('should create a view-trigger alert', () => {
      const input: CreateAlertInput = {
        kind: 'view-trigger',
        name: 'My View Alert',
        viewParams: {
          minSeverity: 'watch',
          signalKeys: ['volume_burst', 'price_move'],
          watchlistId: 'wl-1',
        },
      };

      const alert = createAlertForUser('user-1', input);

      expect(alert.id).toBeDefined();
      expect(alert.userId).toBe('user-1');
      expect(alert.kind).toBe('view-trigger');
      expect(alert.name).toBe('My View Alert');
      expect(alert.enabled).toBe(true);

      if (alert.kind === 'view-trigger') {
        expect(alert.viewParams.minSeverity).toBe('watch');
        expect(alert.viewParams.signalKeys).toEqual(['volume_burst', 'price_move']);
        expect(alert.viewParams.watchlistId).toBe('wl-1');
      }
    });

    it('should respect enabled flag when provided', () => {
      const input: CreateAlertInput = {
        kind: 'signal-threshold',
        name: 'Disabled Alert',
        signalId: 'volume_burst',
        minSeverity: 'action',
        enabled: false,
      };

      const alert = createAlertForUser('user-1', input);

      expect(alert.enabled).toBe(false);
    });
  });

  describe('listAlertsForUser', () => {
    it('should return empty array when no alerts exist', () => {
      const alerts = listAlertsForUser('user-1');
      expect(alerts).toEqual([]);
    });

    it('should return only alerts for the specified user', () => {
      createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      createAlertForUser('user-2', {
        kind: 'signal-threshold',
        name: 'Alert 2',
        signalId: 'price_move',
        minSeverity: 'watch',
      });

      createAlertForUser('user-1', {
        kind: 'view-trigger',
        name: 'Alert 3',
        viewParams: { minSeverity: 'info', signalKeys: [], watchlistId: null },
      });

      const user1Alerts = listAlertsForUser('user-1');
      const user2Alerts = listAlertsForUser('user-2');

      expect(user1Alerts).toHaveLength(2);
      expect(user2Alerts).toHaveLength(1);
      expect(user1Alerts.every((a) => a.userId === 'user-1')).toBe(true);
      expect(user2Alerts.every((a) => a.userId === 'user-2')).toBe(true);
    });
  });

  describe('getAlertForUser', () => {
    it('should return null when alert does not exist', () => {
      const alert = getAlertForUser('user-1', 'non-existent');
      expect(alert).toBeNull();
    });

    it('should return null when alert exists but belongs to different user', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const alert = getAlertForUser('user-2', created.id);
      expect(alert).toBeNull();
    });

    it('should return alert when it exists and belongs to user', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const alert = getAlertForUser('user-1', created.id);
      expect(alert).not.toBeNull();
      expect(alert?.id).toBe(created.id);
      expect(alert?.name).toBe('Alert 1');
    });
  });

  describe('updateAlertForUser', () => {
    it('should return null when alert does not exist', () => {
      const updated = updateAlertForUser('user-1', 'non-existent', { name: 'New Name' });
      expect(updated).toBeNull();
    });

    it('should return null when alert belongs to different user', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const updated = updateAlertForUser('user-2', created.id, { name: 'New Name' });
      expect(updated).toBeNull();
    });

    it('should update alert name', async () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Old Name',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      // Small delay to ensure updatedAt timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = updateAlertForUser('user-1', created.id, { name: 'New Name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('New Name');
      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should update enabled flag', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
        enabled: true,
      });

      const updated = updateAlertForUser('user-1', created.id, { enabled: false });

      expect(updated?.enabled).toBe(false);
    });

    it('should preserve kind and userId', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const updated = updateAlertForUser('user-1', created.id, { name: 'New Name' });

      expect(updated?.kind).toBe('signal-threshold');
      expect(updated?.userId).toBe('user-1');
    });
  });

  describe('deleteAlertForUser', () => {
    it('should return false when alert does not exist', () => {
      const deleted = deleteAlertForUser('user-1', 'non-existent');
      expect(deleted).toBe(false);
    });

    it('should return false when alert belongs to different user', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const deleted = deleteAlertForUser('user-2', created.id);
      expect(deleted).toBe(false);
    });

    it('should delete alert and return true', () => {
      const created = createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      const deleted = deleteAlertForUser('user-1', created.id);
      expect(deleted).toBe(true);

      const retrieved = getAlertForUser('user-1', created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('clearAllAlerts', () => {
    it('should remove all alerts', () => {
      createAlertForUser('user-1', {
        kind: 'signal-threshold',
        name: 'Alert 1',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      createAlertForUser('user-2', {
        kind: 'signal-threshold',
        name: 'Alert 2',
        signalId: 'price_move',
        minSeverity: 'watch',
      });

      clearAllAlerts();

      expect(listAlertsForUser('user-1')).toEqual([]);
      expect(listAlertsForUser('user-2')).toEqual([]);
    });
  });
});

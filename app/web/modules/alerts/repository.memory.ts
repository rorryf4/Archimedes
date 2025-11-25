import type { UserAlert, CreateAlertInput, UpdateAlertInput } from './types';

/**
 * In-memory repository for user alerts
 * Follows the same pattern as savedViews.repository.memory.ts
 */

const alerts = new Map<string, UserAlert>();

/**
 * Get all alerts for a specific user
 */
export function listAlertsForUser(userId: string): UserAlert[] {
  const userAlerts: UserAlert[] = [];
  for (const alert of alerts.values()) {
    if (alert.userId === userId) {
      userAlerts.push(alert);
    }
  }
  return userAlerts;
}

/**
 * Get a specific alert by ID for a user
 */
export function getAlertForUser(userId: string, alertId: string): UserAlert | null {
  const alert = alerts.get(alertId);
  if (!alert || alert.userId !== userId) {
    return null;
  }
  return alert;
}

/**
 * Create a new alert for a user
 */
export function createAlertForUser(userId: string, input: CreateAlertInput): UserAlert {
  const now = new Date().toISOString();
  const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let alert: UserAlert;

  if (input.kind === 'signal-threshold') {
    alert = {
      id,
      userId,
      kind: 'signal-threshold',
      name: input.name,
      signalId: input.signalId,
      minSeverity: input.minSeverity,
      enabled: input.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
  } else {
    alert = {
      id,
      userId,
      kind: 'view-trigger',
      name: input.name,
      viewParams: input.viewParams,
      enabled: input.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
  }

  alerts.set(id, alert);
  return alert;
}

/**
 * Update an existing alert for a user
 */
export function updateAlertForUser(
  userId: string,
  alertId: string,
  input: UpdateAlertInput
): UserAlert | null {
  const existing = getAlertForUser(userId, alertId);
  if (!existing) {
    return null;
  }

  const updated: UserAlert = {
    ...existing,
    ...input,
    id: existing.id,
    userId: existing.userId,
    kind: existing.kind,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  } as UserAlert;

  alerts.set(alertId, updated);
  return updated;
}

/**
 * Delete an alert for a user
 */
export function deleteAlertForUser(userId: string, alertId: string): boolean {
  const alert = getAlertForUser(userId, alertId);
  if (!alert) {
    return false;
  }
  return alerts.delete(alertId);
}

/**
 * Clear all alerts (for testing)
 */
export function clearAllAlerts(): void {
  alerts.clear();
}

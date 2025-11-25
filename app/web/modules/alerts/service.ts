import { getCurrentUserContext } from '../watchlists/data';
import type { UserAlert, CreateAlertInput, UpdateAlertInput } from './types';
import type { TriggeredAlertEvent } from './events.types';
import type { Opportunity } from '../opportunities/service';
import type { SignalResult } from '../signals/types';
import {
  listAlertsForUser,
  getAlertForUser,
  createAlertForUser,
  updateAlertForUser,
  deleteAlertForUser,
} from './repository.memory';
import {
  appendTriggeredAlertEvent,
  listTriggeredAlertEventsForUser,
} from './events.repository.memory';
import { shouldTriggerAlert, recordAlertTrigger } from './deduping';

/**
 * Severity ranking for comparison (higher = more severe)
 */
const SEVERITY_RANK = {
  none: 0,
  info: 1,
  watch: 2,
  action: 3,
} as const;

/**
 * Get all alerts for the current user
 */
export async function listAlertsForCurrentUser(): Promise<UserAlert[]> {
  const { userId } = await getCurrentUserContext();
  return listAlertsForUser(userId);
}

/**
 * Get a specific alert for the current user
 */
export async function getAlertForCurrentUser(alertId: string): Promise<UserAlert | null> {
  const { userId } = await getCurrentUserContext();
  return getAlertForUser(userId, alertId);
}

/**
 * Create a new alert for the current user
 */
export async function createAlertForCurrentUser(input: CreateAlertInput): Promise<UserAlert> {
  const { userId } = await getCurrentUserContext();
  return createAlertForUser(userId, input);
}

/**
 * Update an existing alert for the current user
 */
export async function updateAlertForCurrentUser(
  alertId: string,
  input: UpdateAlertInput
): Promise<UserAlert | null> {
  const { userId } = await getCurrentUserContext();
  return updateAlertForUser(userId, alertId, input);
}

/**
 * Delete an alert for the current user
 */
export async function deleteAlertForCurrentUser(alertId: string): Promise<boolean> {
  const { userId } = await getCurrentUserContext();
  return deleteAlertForUser(userId, alertId);
}

/**
 * List triggered alert events for the current user
 */
export async function listTriggeredAlertEventsForCurrentUser(
  limit?: number
): Promise<TriggeredAlertEvent[]> {
  const { userId } = await getCurrentUserContext();
  return listTriggeredAlertEventsForUser(userId, limit);
}

/**
 * Evaluate alerts against a list of opportunities
 * Returns triggered alert events (and appends them to the event log)
 */
export async function evaluateAlertsForOpportunities(
  opportunities: Opportunity[]
): Promise<TriggeredAlertEvent[]> {
  const { userId } = await getCurrentUserContext();
  const alerts = listAlertsForUser(userId);

  const triggeredEvents: TriggeredAlertEvent[] = [];

  // Filter to only enabled alerts
  const enabledAlerts = alerts.filter((alert) => alert.enabled);

  for (const alert of enabledAlerts) {
    if (alert.kind === 'signal-threshold') {
      // Evaluate signal-threshold alerts
      for (const opportunity of opportunities) {
        // Check if the opportunity has the specified signal at or above minSeverity
        const matchingSignal = opportunity.signals.find(
          (signal: SignalResult) =>
            signal.id === alert.signalId &&
            SEVERITY_RANK[signal.severity] >= SEVERITY_RANK[alert.minSeverity]
        );

        if (matchingSignal) {
          // Check deduping: only trigger if cooldown period has elapsed
          if (shouldTriggerAlert(alert.id, opportunity.id)) {
            const event = appendTriggeredAlertEvent({
              alert,
              opportunity,
              triggeringSignalId: matchingSignal.id,
            });
            triggeredEvents.push(event);
            recordAlertTrigger(alert.id, opportunity.id);
          }
        }
      }
    } else if (alert.kind === 'view-trigger') {
      // Evaluate view-trigger alerts
      // An opportunity matches if it satisfies all the view params criteria
      for (const opportunity of opportunities) {
        const matches = matchesViewParams(opportunity, alert.viewParams);

        if (matches) {
          // Check deduping: only trigger if cooldown period has elapsed
          if (shouldTriggerAlert(alert.id, opportunity.id)) {
            const event = appendTriggeredAlertEvent({
              alert,
              opportunity,
            });
            triggeredEvents.push(event);
            recordAlertTrigger(alert.id, opportunity.id);
          }
        }
      }
    }
  }

  return triggeredEvents;
}

/**
 * Check if an opportunity matches the saved view params
 */
function matchesViewParams(
  opportunity: Opportunity,
  viewParams: { minSeverity: string; signalKeys: string[]; watchlistId: string | null }
): boolean {
  // Check minSeverity
  const opportunitySeverity = opportunity.primarySignal?.severity ?? 'none';
  if (SEVERITY_RANK[opportunitySeverity] < SEVERITY_RANK[viewParams.minSeverity as keyof typeof SEVERITY_RANK]) {
    return false;
  }

  // Check signalKeys (if specified)
  if (viewParams.signalKeys.length > 0) {
    const hasMatchingSignal = opportunity.signals.some((signal: SignalResult) =>
      viewParams.signalKeys.includes(signal.id)
    );
    if (!hasMatchingSignal) {
      return false;
    }
  }

  // Check watchlistId (if specified)
  if (viewParams.watchlistId) {
    const isInWatchlist = opportunity.watchlists.some((wl: { id: string; name: string }) => wl.id === viewParams.watchlistId);
    if (!isInWatchlist) {
      return false;
    }
  }

  return true;
}

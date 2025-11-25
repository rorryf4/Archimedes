import type { TriggeredAlertEvent, TriggerEventContext } from './events.types';

/**
 * In-memory repository for triggered alert events
 * Events are stored in append-only fashion and returned in reverse chronological order
 */

const events: TriggeredAlertEvent[] = [];

/**
 * Append a new triggered alert event
 */
export function appendTriggeredAlertEvent(context: TriggerEventContext): TriggeredAlertEvent {
  const event: TriggeredAlertEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: context.alert.userId,
    alertId: context.alert.id,
    alertName: context.alert.name,
    alertKind: context.alert.kind,
    triggeredAt: new Date().toISOString(),
    opportunityId: context.opportunity.id,
    opportunitySymbol: context.opportunity.symbol,
    opportunityName: context.opportunity.name,
    triggeringSignalId: context.triggeringSignalId ?? null,
  };

  events.push(event);
  return event;
}

/**
 * List triggered alert events for a user (most recent first)
 * @param userId - User ID to filter by
 * @param limit - Maximum number of events to return (default: 100)
 */
export function listTriggeredAlertEventsForUser(
  userId: string,
  limit: number = 100
): TriggeredAlertEvent[] {
  const userEvents = events.filter((event) => event.userId === userId);

  // Return in reverse chronological order (most recent first)
  return userEvents
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .slice(0, limit);
}

/**
 * Clear all triggered alert events (for testing)
 */
export function clearAllTriggeredAlertEvents(): void {
  events.length = 0;
}

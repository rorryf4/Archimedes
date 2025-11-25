import type { UserAlert } from './types';
import type { Opportunity } from '../opportunities/service';

/**
 * Triggered alert event
 * Represents a single instance of an alert being triggered
 */
export interface TriggeredAlertEvent {
  id: string;
  userId: string;
  alertId: string;
  alertName: string;
  alertKind: 'signal-threshold' | 'view-trigger';
  triggeredAt: string;
  opportunityId: string;
  opportunitySymbol: string;
  opportunityName: string;
  /**
   * For signal-threshold alerts: the signal that triggered the alert
   * For view-trigger alerts: null (the opportunity matched the view criteria)
   */
  triggeringSignalId: string | null;
}

/**
 * Context for creating a triggered alert event
 */
export interface TriggerEventContext {
  alert: UserAlert;
  opportunity: Opportunity;
  triggeringSignalId?: string;
}

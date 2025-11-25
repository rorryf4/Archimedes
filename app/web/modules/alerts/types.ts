import type { SignalSeverity } from '../signals/types';
import type { SavedOpportunityViewParams } from '../opportunities/savedViews.types';

/**
 * Alert kind discriminator
 */
export type AlertKind = 'signal-threshold' | 'view-trigger';

/**
 * Base alert properties shared by all alert types
 */
interface BaseAlert {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Signal threshold alert
 * Triggers when any opportunity has a signal at or above the specified severity
 */
export interface SignalThresholdAlert extends BaseAlert {
  kind: 'signal-threshold';
  signalId: string; // e.g., 'volume_burst'
  minSeverity: SignalSeverity; // e.g., 'action'
}

/**
 * View trigger alert
 * Triggers when any opportunities match the saved view criteria
 */
export interface ViewTriggerAlert extends BaseAlert {
  kind: 'view-trigger';
  viewParams: SavedOpportunityViewParams;
}

/**
 * Union type for all alert types
 */
export type UserAlert = SignalThresholdAlert | ViewTriggerAlert;

/**
 * Input for creating a new alert
 */
export type CreateAlertInput =
  | {
      kind: 'signal-threshold';
      name: string;
      signalId: string;
      minSeverity: SignalSeverity;
      enabled?: boolean;
    }
  | {
      kind: 'view-trigger';
      name: string;
      viewParams: SavedOpportunityViewParams;
      enabled?: boolean;
    };

/**
 * Input for updating an existing alert
 */
export type UpdateAlertInput = Partial<
  Omit<SignalThresholdAlert | ViewTriggerAlert, 'id' | 'userId' | 'kind' | 'createdAt' | 'updatedAt'>
>;

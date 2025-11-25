import type { SignalSeverity } from './types';

/**
 * Per-signal preference configuration.
 * Controls whether a signal is enabled and optionally its minimum severity threshold.
 */
export interface SignalPreference {
  signalId: string;
  enabled: boolean;
  /** Optional per-signal minimum severity threshold. If null, uses global default. */
  minSeverity?: SignalSeverity | null;
}

/**
 * User-scoped signal preferences.
 * Controls default filtering and signal enablement for opportunities.
 */
export interface UserSignalPreferences {
  userId: string;
  /** Global default minimum severity threshold for all signals */
  defaultMinSeverity: SignalSeverity;
  /** Per-signal preferences. Signals not in this list default to enabled. */
  signalPreferences: SignalPreference[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating or updating user signal preferences.
 */
export interface UpdateUserSignalPreferencesInput {
  defaultMinSeverity?: SignalSeverity;
  signalPreferences?: SignalPreference[];
}

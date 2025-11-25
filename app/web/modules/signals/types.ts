import type { MarketSnapshot } from '../markets/marketData';

/**
 * Severity levels for signals, from least to most urgent.
 */
export type SignalSeverity = 'none' | 'info' | 'watch' | 'action';

/**
 * The result of computing a signal against a market snapshot.
 */
export interface SignalResult {
  /** Unique identifier for this signal type, e.g. 'volume_burst_1m' */
  id: string;
  /** Human-readable name, e.g. '1m Volume Burst' */
  label: string;
  /** Computed value, or null if unavailable */
  value: number | null;
  /** Unit of measurement, e.g. '%', 'score', 'x' */
  unit?: string;
  /** Direction of change */
  direction?: 'up' | 'down' | 'flat';
  /** Severity level based on thresholds */
  severity: SignalSeverity;
  /** ISO-8601 timestamp when this signal was computed */
  timestamp: string;
  /** Additional metadata for debugging or extended info */
  meta?: Record<string, unknown>;
}

/**
 * Context passed to signal computation functions.
 * Provides market-wide data and reference points.
 */
export interface SignalContext {
  /** Current time for signal computation */
  now: Date;
  /** BTC market snapshot for correlation/comparison */
  btcSnapshot?: MarketSnapshot;
  /** Placeholder for market-wide baselines and aggregates */
  baselines?: Record<string, unknown>;
}

/**
 * Definition of a signal that can be computed against market data.
 */
export interface SignalDefinition {
  /** Unique identifier for this signal definition */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this signal measures */
  description: string;
  /** Compute the signal result from a market snapshot and context */
  compute(snapshot: MarketSnapshot, context: SignalContext): SignalResult;
}

/**
 * Type alias for signal identifiers.
 */
export type SignalId = string;
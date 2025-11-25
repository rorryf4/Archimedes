// app/web/modules/signals/index.ts

import type { MarketSnapshot } from '../markets/marketData';
import {
  SignalsEngine,
  runSignalsForSnapshot,
} from './engine';
import type {
  SignalContext,
  SignalDefinition,
  SignalResult,
} from './types';
import { builtinSignals } from './builtin';

/**
 * Factory for a signals engine preloaded with all built-in signals.
 */
export function createDefaultSignalsEngine(
  signals: SignalDefinition[] = builtinSignals,
): SignalsEngine {
  return new SignalsEngine({ signals });
}

/**
 * Convenience helper to run the built-in signals against a single snapshot
 * without manually instantiating an engine.
 */
export function runBuiltinSignalsForSnapshot(
  snapshot: MarketSnapshot,
  context: Omit<SignalContext, 'now'> & { now?: Date } = { },
): SignalResult[] {
  const engine = createDefaultSignalsEngine();
  const now = context.now ?? new Date();

  return runSignalsForSnapshot(
    snapshot,
    { ...context, now },
    engine.getRegisteredSignals(),
  );
}

// Re-export core types so other modules can depend on the public surface
// of the signals module without reaching into internal files.
export type {
  SignalContext,
  SignalDefinition,
  SignalResult,
  SignalSeverity,
} from './types';

// Re-export catalog utilities for UI consumption
export {
  getSignalCatalog,
  getSeverityMeta,
  getSeverityRank,
  sortSignalsBySeverity,
  filterByMinSeverity,
  getPrimarySignal,
  countSignalsBySeverity,
  hasSignalAtOrAbove,
  SEVERITY_META,
} from './catalog';

export type { SignalCatalogEntry, SeverityMeta } from './catalog';

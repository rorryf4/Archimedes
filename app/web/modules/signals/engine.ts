// app/web/modules/signals/engine.ts

import type { MarketSnapshot } from '../markets/marketData';
import type {
  SignalContext,
  SignalDefinition,
  SignalResult,
} from './types';

/**
 * Configuration for the signals engine. For now this is just the list of
 * signal definitions, but we can extend this later with toggles, sampling
 * intervals, etc.
 */
export interface SignalsEngineConfig {
  signals: SignalDefinition[];
}

/**
 * Functional helper to run a set of signals against a single snapshot.
 * This is the core primitive; the SignalsEngine class is just a thin wrapper.
 */
export function runSignalsForSnapshot(
  snapshot: MarketSnapshot,
  context: SignalContext,
  signals: SignalDefinition[],
): SignalResult[] {
  return signals.map((signal) => computeSignalSafe(signal, snapshot, context));
}

/**
 * Small wrapper class that holds a fixed set of signals and can be reused
 * across many computations.
 */
export class SignalsEngine {
  private readonly signals: SignalDefinition[];

  constructor(config: SignalsEngineConfig) {
    this.signals = config.signals;
  }

  /**
   * Run all registered signals for a given snapshot.
   */
  run(snapshot: MarketSnapshot, context: SignalContext): SignalResult[] {
    return runSignalsForSnapshot(snapshot, context, this.signals);
  }

  /**
   * Expose a copy of the registered signal definitions, e.g. for introspection
   * or debugging.
   */
  getRegisteredSignals(): SignalDefinition[] {
    return [...this.signals];
  }
}

/**
 * Wrap a single signal computation in a try/catch so that a bug in one signal
 * cannot take down the entire engine run.
 */
function computeSignalSafe(
  signal: SignalDefinition,
  snapshot: MarketSnapshot,
  context: SignalContext,
): SignalResult {
  try {
    return signal.compute(snapshot, context);
  } catch (error) {
    return {
      id: signal.id,
      label: signal.name,
      value: null,
      unit: undefined,
      severity: 'none',
      timestamp: context.now.toISOString(),
      meta: {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error during signal computation',
      },
    };
  }
}

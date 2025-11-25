// app/web/modules/signals/builtin/volumeBurst.ts

import type { MarketSnapshot } from '../../markets/marketData';
import type {
  SignalContext,
  SignalDefinition,
  SignalResult,
  SignalSeverity,
} from '../types';

/**
 * Helper to safely pull numeric fields off MarketSnapshot without
 * depending on its exact TypeScript shape.
 */
function getNumber(snapshot: Record<string, unknown>, key: string): number | null {
  const value = snapshot?.[key];
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function computeVolumeBurst(
  snapshot: MarketSnapshot,
  context: SignalContext,
  {
    volumeKey,
    baselineKey,
    id,
    label,
  }: {
    volumeKey: string;
    baselineKey: string;
    id: string;
    label: string;
  },
): SignalResult {
  const volume = getNumber(snapshot, volumeKey);
  const baseline = getNumber(snapshot, baselineKey);

  const timestamp = context.now.toISOString();

  if (volume === null || baseline === null || baseline <= 0) {
    return {
      id,
      label,
      value: null,
      unit: '%',
      severity: 'none',
      timestamp,
      meta: {
        reason: 'missing_or_invalid_baseline_or_volume',
        volume,
        baseline,
      },
    };
  }

  const ratio = volume / baseline;
  const value = (ratio - 1) * 100; // percentage vs baseline

  let severity: SignalSeverity = 'none';

  // Thresholds:
  // < +100% → none
  // 100–200% → info
  // 200–400% → watch
  // > 400% → action
  if (value >= 400) {
    severity = 'action';
  } else if (value >= 200) {
    severity = 'watch';
  } else if (value >= 100) {
    severity = 'info';
  }

  return {
    id,
    label,
    value,
    unit: '%',
    severity,
    timestamp,
    meta: {
      volume,
      baseline,
      ratio,
    },
  };
}

/**
 * 1-minute volume burst signal.
 *
 * Expects the MarketSnapshot to provide:
 *  - "volume_1m"
 *  - "avg_volume_1m_baseline"
 *
 * If those fields are not present in the snapshot shape, this signal will
 * simply return a null value and "none" severity until the wiring is updated.
 */
export const volumeBurst1mSignal: SignalDefinition = {
  id: 'volume_burst_1m',
  name: '1m Volume Burst',
  description:
    'Compares the last 1 minute of volume to a 1m baseline to detect sudden spikes.',
  compute(snapshot: MarketSnapshot, context: SignalContext): SignalResult {
    return computeVolumeBurst(snapshot, context, {
      volumeKey: 'volume_1m',
      baselineKey: 'avg_volume_1m_baseline',
      id: 'volume_burst_1m',
      label: '1m Volume Burst',
    });
  },
};

/**
 * 5-minute volume burst signal.
 *
 * Expects the MarketSnapshot to provide:
 *  - "volume_5m"
 *  - "avg_volume_5m_baseline"
 */
export const volumeBurst5mSignal: SignalDefinition = {
  id: 'volume_burst_5m',
  name: '5m Volume Burst',
  description:
    'Compares the last 5 minutes of volume to a 5m baseline to detect sustained spikes.',
  compute(snapshot: MarketSnapshot, context: SignalContext): SignalResult {
    return computeVolumeBurst(snapshot, context, {
      volumeKey: 'volume_5m',
      baselineKey: 'avg_volume_5m_baseline',
      id: 'volume_burst_5m',
      label: '5m Volume Burst',
    });
  },
};

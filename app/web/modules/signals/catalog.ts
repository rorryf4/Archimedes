// app/web/modules/signals/catalog.ts

import type { SignalResult, SignalSeverity } from './types';
import { builtinSignals } from './builtin';
import { listSignalDefinitions, getSignalDefinition } from './registry';

/**
 * Catalog entry for a signal type, providing UI metadata.
 */
export interface SignalCatalogEntry {
  id: string;
  label: string;
  description: string;
  /** Icon name or emoji for UI display */
  icon?: string;
}

/**
 * Severity metadata for UI display and sorting.
 */
export interface SeverityMeta {
  level: SignalSeverity;
  /** Numeric rank for sorting (higher = more urgent) */
  rank: number;
  /** Human-readable label */
  label: string;
  /** CSS color class or hex color */
  color: string;
}

/**
 * Severity ranking map - higher rank = more urgent
 */
export const SEVERITY_META: Record<SignalSeverity, SeverityMeta> = {
  none: { level: 'none', rank: 0, label: 'None', color: 'gray' },
  info: { level: 'info', rank: 1, label: 'Info', color: 'blue' },
  watch: { level: 'watch', rank: 2, label: 'Watch', color: 'yellow' },
  action: { level: 'action', rank: 3, label: 'Action', color: 'red' },
};

/**
 * Get all registered signal types.
 * Combines builtin signals with additional entries from the registry.
 */
export function getSignalCatalog(): SignalCatalogEntry[] {
  // Start with builtin signals (these have compute functions)
  const builtinEntries = builtinSignals.map((def) => ({
    id: def.id,
    label: def.name,
    description: def.description,
  }));

  // Get IDs we already have from builtins
  const builtinIds = new Set(builtinEntries.map((e) => e.id));

  // Add any registry entries that aren't already in builtins
  const registryEntries = listSignalDefinitions()
    .filter((entry) => !builtinIds.has(entry.key))
    .map((entry) => ({
      id: entry.key,
      label: entry.label,
      description: entry.description ?? '',
    }));

  return [...builtinEntries, ...registryEntries];
}

/**
 * Get catalog entry for a specific signal by ID.
 * Uses the registry as the source of truth for metadata.
 */
export function getSignalCatalogEntry(id: string): SignalCatalogEntry | null {
  // Check registry first
  const registryEntry = getSignalDefinition(id);
  if (registryEntry) {
    return {
      id: registryEntry.key,
      label: registryEntry.label,
      description: registryEntry.description ?? '',
    };
  }

  // Fall back to builtin signals
  const builtin = builtinSignals.find((s) => s.id === id);
  if (builtin) {
    return {
      id: builtin.id,
      label: builtin.name,
      description: builtin.description,
    };
  }

  return null;
}

/**
 * Get severity metadata for a given severity level.
 */
export function getSeverityMeta(severity: SignalSeverity): SeverityMeta {
  return SEVERITY_META[severity];
}

/**
 * Get numeric rank for a severity (for sorting).
 */
export function getSeverityRank(severity: SignalSeverity): number {
  return SEVERITY_META[severity].rank;
}

/**
 * Sort signals by severity (most urgent first).
 * Signals with same severity are stable-sorted.
 */
export function sortSignalsBySeverity(signals: SignalResult[]): SignalResult[] {
  return [...signals].sort(
    (a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity),
  );
}

/**
 * Filter signals to only those with severity >= minSeverity.
 */
export function filterByMinSeverity(
  signals: SignalResult[],
  minSeverity: SignalSeverity,
): SignalResult[] {
  const minRank = getSeverityRank(minSeverity);
  return signals.filter((s) => getSeverityRank(s.severity) >= minRank);
}

/**
 * Pick the "primary" signal for display - the highest severity signal.
 * Returns undefined if no signals or all are 'none' severity.
 */
export function getPrimarySignal(
  signals: SignalResult[],
): SignalResult | undefined {
  const actionable = signals.filter((s) => s.severity !== 'none');
  if (actionable.length === 0) return undefined;

  return sortSignalsBySeverity(actionable)[0];
}

/**
 * Count signals by severity level.
 */
export function countSignalsBySeverity(
  signals: SignalResult[],
): Record<SignalSeverity, number> {
  const counts: Record<SignalSeverity, number> = {
    none: 0,
    info: 0,
    watch: 0,
    action: 0,
  };

  for (const signal of signals) {
    counts[signal.severity]++;
  }

  return counts;
}

/**
 * Check if any signal has severity >= threshold.
 */
export function hasSignalAtOrAbove(
  signals: SignalResult[],
  threshold: SignalSeverity,
): boolean {
  const minRank = getSeverityRank(threshold);
  return signals.some((s) => getSeverityRank(s.severity) >= minRank);
}

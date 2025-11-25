'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Opportunity } from '@/modules/opportunities/service';
import { getSeverityMeta } from '@/modules/signals';
import type { SignalResult, SignalSeverity } from '@/modules/signals';
import { OpportunityDetailPanel } from './OpportunityDetailPanel';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  currentViewId?: string;
}

function SignalBadge({ signal }: { signal: SignalResult }) {
  const meta = getSeverityMeta(signal.severity);
  const colorMap: Record<string, string> = {
    gray: 'bg-slate-700 text-slate-300',
    blue: 'bg-blue-900/50 text-blue-300',
    yellow: 'bg-yellow-900/50 text-yellow-300',
    red: 'bg-red-900/50 text-red-300',
  };
  const colorClass = colorMap[meta.color] || colorMap.gray;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
      title={signal.label}
    >
      {meta.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let colorClass: string;
  let label: string;

  if (score >= 80) {
    colorClass = 'bg-green-900/50 text-green-300 border-green-700';
    label = 'Strong';
  } else if (score >= 60) {
    colorClass = 'bg-blue-900/50 text-blue-300 border-blue-700';
    label = 'Good';
  } else if (score >= 40) {
    colorClass = 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
    label = 'Meh';
  } else {
    colorClass = 'bg-red-900/50 text-red-300 border-red-700';
    label = 'Weak';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold border ${colorClass}`}
      title={label}
    >
      {score}
    </span>
  );
}

function KindBadge({ kind }: { kind: 'token' | 'market' }) {
  const isToken = kind === 'token';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
        isToken
          ? 'bg-purple-900/50 text-purple-300'
          : 'bg-cyan-900/50 text-cyan-300'
      }`}
    >
      {kind}
    </span>
  );
}

function SeveritySummary({
  counts,
}: {
  counts: Record<SignalSeverity, number>;
}) {
  const parts: { label: string; count: number; color: string }[] = [];

  if (counts.action > 0) {
    parts.push({ label: 'Action', count: counts.action, color: 'text-red-400' });
  }
  if (counts.watch > 0) {
    parts.push({ label: 'Watch', count: counts.watch, color: 'text-yellow-400' });
  }
  if (counts.info > 0) {
    parts.push({ label: 'Info', count: counts.info, color: 'text-blue-400' });
  }

  if (parts.length === 0) {
    return <span className="text-slate-500">-</span>;
  }

  return (
    <span className="text-xs">
      {parts.map((part, i) => (
        <span key={part.label}>
          {i > 0 && <span className="text-slate-600"> · </span>}
          <span className={part.color}>
            {part.label} {part.count}
          </span>
        </span>
      ))}
    </span>
  );
}

function WatchlistChips({
  watchlists,
}: {
  watchlists: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {watchlists.map((wl) => (
        <Link
          key={wl.id}
          href={`/watchlists/${wl.id}`}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-200 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {wl.name}
        </Link>
      ))}
    </div>
  );
}

export function OpportunitiesTable({ opportunities, currentViewId }: OpportunitiesTableProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No opportunities found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Type
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Score
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Primary Signal
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Severity Summary
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  24h Change
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  24h Volume
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Watchlists
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {opportunities.map((opp) => {
                const changeFormatted =
                  opp.priceChange24h !== null
                    ? `${opp.priceChange24h > 0 ? '+' : ''}${opp.priceChange24h.toFixed(2)}%`
                    : '-';

                const changeColor =
                  opp.priceChange24h !== null
                    ? opp.priceChange24h > 0
                      ? 'text-green-400'
                      : opp.priceChange24h < 0
                        ? 'text-red-400'
                        : 'text-slate-400'
                    : 'text-slate-500';

                const volumeFormatted =
                  opp.volume24h !== null
                    ? opp.volume24h >= 1_000_000_000
                      ? `$${(opp.volume24h / 1_000_000_000).toFixed(2)}B`
                      : opp.volume24h >= 1_000_000
                        ? `$${(opp.volume24h / 1_000_000).toFixed(2)}M`
                        : `$${opp.volume24h.toLocaleString()}`
                    : '-';

                return (
                  <tr
                    key={opp.id}
                    onClick={() => setSelectedOpportunity(opp)}
                    className="hover:bg-slate-750 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/assets/${opp.id}`}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {opp.symbol}
                        </Link>
                        <span className="text-xs text-slate-400">{opp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <KindBadge kind={opp.kind} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={opp.score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {opp.primarySignal ? (
                        <SignalBadge signal={opp.primarySignal} />
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SeveritySummary counts={opp.severityCounts} />
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${changeColor}`}
                    >
                      {changeFormatted}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-400">
                      {volumeFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <WatchlistChips watchlists={opp.watchlists} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedOpportunity && (
        <OpportunityDetailPanel
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          currentViewId={currentViewId}
        />
      )}
    </>
  );
}

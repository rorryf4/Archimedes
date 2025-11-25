'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { DashboardTopMoverWithSignals } from '@/modules/watchlists/dashboard';
import { getSeverityMeta } from '@/modules/signals';
import type { SignalResult } from '@/modules/signals';

interface TopMoversPanelProps {
  initialMovers: DashboardTopMoverWithSignals[];
}

function SignalBadge({ signal }: { signal: SignalResult }) {
  const meta = getSeverityMeta(signal.severity);
  const colorMap: Record<string, string> = {
    gray: 'bg-slate-600 text-slate-200',
    blue: 'bg-blue-600 text-blue-100',
    yellow: 'bg-yellow-600 text-yellow-100',
    red: 'bg-red-600 text-red-100',
  };
  const colorClass = colorMap[meta.color] || colorMap.gray;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
      title={signal.label}
    >
      {signal.id}
    </span>
  );
}

type SortBy = 'severity' | 'changeAbs' | 'price';

export function TopMoversPanel({ initialMovers }: TopMoversPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('severity');

  const filteredMovers = useMemo(() => {
    let result = initialMovers;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (mover) =>
          mover.symbol.toLowerCase().includes(query) ||
          mover.name.toLowerCase().includes(query)
      );
    }

    // Sort based on selected option
    return [...result].sort((a, b) => {
      if (sortBy === 'severity') {
        if (b.severityRank !== a.severityRank) {
          return b.severityRank - a.severityRank;
        }
        return Math.abs(b.priceChange24h ?? 0) - Math.abs(a.priceChange24h ?? 0);
      } else if (sortBy === 'changeAbs') {
        return Math.abs(b.priceChange24h ?? 0) - Math.abs(a.priceChange24h ?? 0);
      } else {
        return (b.price ?? 0) - (a.price ?? 0);
      }
    });
  }, [initialMovers, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol or name..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="severity">Signal Severity</option>
            <option value="changeAbs">Change (abs %)</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredMovers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {searchQuery ? `No movers found matching "${searchQuery}"` : 'No market data available'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Symbol
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  24h Change
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Signal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredMovers.map((mover) => {
                const changeFormatted =
                  typeof mover.priceChange24h === 'number'
                    ? `${mover.priceChange24h > 0 ? '+' : ''}${mover.priceChange24h.toFixed(2)}%`
                    : '-';

                const changeColor =
                  typeof mover.priceChange24h === 'number'
                    ? mover.priceChange24h > 0
                      ? 'text-green-400'
                      : 'text-red-400'
                    : 'text-slate-400';

                return (
                  <tr key={mover.id} className="hover:bg-slate-750">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        href={`/assets/${mover.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {mover.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      <Link
                        href={`/assets/${mover.id}`}
                        className="hover:text-slate-300 hover:underline"
                      >
                        {mover.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {typeof mover.price === 'number'
                        ? `$${mover.price.toLocaleString()}`
                        : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${changeColor}`}
                    >
                      {changeFormatted}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {mover.primarySignal ? (
                        <div className="flex items-center justify-center gap-2">
                          <SignalBadge signal={mover.primarySignal} />
                          <Link
                            href={`/opportunities?signals=${encodeURIComponent(mover.primarySignal.id)}&minSeverity=${encodeURIComponent(mover.primarySignal.severity)}`}
                            className="text-xs text-slate-400 hover:text-slate-200 underline"
                          >
                            See similar
                          </Link>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

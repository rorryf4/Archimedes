import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItemByIdEnriched } from '@/modules/watchlists/drilldown';
import { getSignalDefinition, getSignalLabel } from '@/modules/signals/registry';
import { getSeverityRank } from '@/modules/signals/catalog';
import { getCandlestickData } from '@/modules/markets/candles';
import { PriceChart } from '@/components/markets/PriceChart';
import type { SignalResult } from '@/modules/signals/types';

interface AssetPageProps {
  params: Promise<{
    itemId: string;
  }>;
}

function getSeverityColor(severity: SignalResult['severity']): string {
  switch (severity) {
    case 'action':
      return 'text-red-400 bg-red-900/30 border-red-800';
    case 'watch':
      return 'text-yellow-400 bg-yellow-900/30 border-yellow-800';
    case 'info':
      return 'text-blue-400 bg-blue-900/30 border-blue-800';
    default:
      return 'text-slate-400 bg-slate-900/30 border-slate-800';
  }
}

function getSeverityLabel(severity: SignalResult['severity']): string {
  switch (severity) {
    case 'action':
      return 'Action';
    case 'watch':
      return 'Watch';
    case 'info':
      return 'Info';
    default:
      return 'None';
  }
}

interface AssetSignalsPanelProps {
  signals: SignalResult[];
}

function AssetSignalsPanel({ signals }: AssetSignalsPanelProps) {
  // Sort by severity descending (most urgent first)
  const sortedSignals = [...signals].sort(
    (a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity)
  );

  // Filter out 'none' severity signals for display
  const displaySignals = sortedSignals.filter((s) => s.severity !== 'none');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Signals</h2>
      {displaySignals.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-400">No active signals for this asset.</p>
          <p className="text-slate-500 text-sm mt-1">
            Signals will appear here when market conditions trigger them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySignals.map((signal) => {
            const definition = getSignalDefinition(signal.id);
            const label = getSignalLabel(signal.id);
            const category = definition?.category ?? 'other';

            return (
              <div
                key={signal.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{label}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded border ${getSeverityColor(signal.severity)}`}
                      >
                        {getSeverityLabel(signal.severity)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="capitalize">{category}</span>
                      {signal.value !== null && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>
                            {signal.value.toFixed(1)}
                            {signal.unit ?? ''}
                          </span>
                        </>
                      )}
                      {signal.timestamp && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { itemId } = await params;
  const [asset, candleData] = await Promise.all([
    getItemByIdEnriched(itemId),
    getCandlestickData(itemId),
  ]);

  if (!asset) {
    notFound();
  }

  const changeColor =
    typeof asset.priceChange24h === 'number'
      ? asset.priceChange24h >= 0
        ? 'text-green-400'
        : 'text-red-400'
      : 'text-slate-400';

  const changeFormatted =
    typeof asset.priceChange24h === 'number'
      ? `${asset.priceChange24h >= 0 ? '+' : ''}${asset.priceChange24h.toFixed(2)}%`
      : '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">{asset.symbol}</h1>
            <p className="text-lg text-slate-400 mb-3">{asset.name}</p>
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${
                asset.kind === 'token'
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                  : 'bg-purple-900/30 text-purple-400 border border-purple-800'
              }`}
            >
              {asset.kind}
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/opportunities?assetId=${itemId}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Open Saved Views
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Key Metrics and Price Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Price</div>
                <div className="text-2xl font-bold">
                  {typeof asset.price === 'number'
                    ? `$${asset.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '—'}
                </div>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">24h Change</div>
                <div className={`text-2xl font-bold ${changeColor}`}>{changeFormatted}</div>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold">
                  {typeof asset.volume24h === 'number'
                    ? `$${(asset.volume24h / 1_000_000_000).toFixed(2)}B`
                    : '—'}
                </div>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Added On</div>
                <div className="text-lg font-medium">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Price Chart (24h)</h2>
            <PriceChart data={candleData} rangeLabel="24h" />
          </div>
        </div>

        {/* Right column - Signals and Watchlists */}
        <div className="space-y-6">
          {/* Signals Panel */}
          <AssetSignalsPanel signals={asset.signals} />

          {/* Watchlists */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Watchlists</h2>
            {asset.watchlists.length === 0 ? (
              <p className="text-slate-400">This asset is not in any watchlists.</p>
            ) : (
              <div className="space-y-2">
                {asset.watchlists.map((watchlist) => (
                  <Link
                    key={watchlist.id}
                    href={`/watchlists/${watchlist.id}`}
                    className="block bg-slate-950 rounded-lg p-4 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{watchlist.name}</span>
                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Details (for markets only) - Full width below */}
      {asset.kind === 'market' && (asset.baseSymbol || asset.quoteSymbol) && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Market Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asset.baseSymbol && (
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Base Asset</div>
                <div className="text-lg font-medium">{asset.baseSymbol}</div>
              </div>
            )}
            {asset.quoteSymbol && (
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Quote Asset</div>
                <div className="text-lg font-medium">{asset.quoteSymbol}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

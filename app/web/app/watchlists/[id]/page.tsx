'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  WatchlistDetailHeaderSkeleton,
  WatchlistItemSkeleton,
} from '@/components/watchlists/SkeletonLoader';
import { ErrorState, NotFoundState } from '@/components/watchlists/ErrorState';
import { EmptyState } from '@/components/watchlists/EmptyState';
import { filterAndSortItems } from '@/modules/watchlists/filtering';
import type { KindFilter, SortBy, SortDirection } from '@/modules/watchlists/filtering';
import type { WatchlistItemEnriched } from '@/modules/watchlists/types';
import {
  getPrimarySignal,
  getSeverityMeta,
  getSignalCatalog,
  hasSignalAtOrAbove,
  type SignalResult,
  type SignalSeverity,
} from '@/modules/signals';

/**
 * Signal severity badge component
 */
function SignalBadge({ signal }: { signal: SignalResult }) {
  const meta = getSeverityMeta(signal.severity);

  const colorClasses: Record<string, string> = {
    gray: 'bg-slate-700 text-slate-300',
    blue: 'bg-blue-900/50 text-blue-300',
    yellow: 'bg-yellow-900/50 text-yellow-300',
    red: 'bg-red-900/50 text-red-300',
  };

  const badgeClass = colorClasses[meta.color] ?? colorClasses.gray;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}
      title={`${signal.label}: ${signal.value !== null ? `${signal.value.toFixed(0)}${signal.unit ?? ''}` : 'N/A'}`}
    >
      {meta.label}
    </span>
  );
}

interface MarketSnapshot {
  price: number | null;
  change24hPct: number | null;
  volume24h: number | null;
  lastUpdated: string | null;
}

// API response item type (has nested market data and signals)
interface WatchlistItemFromAPI {
  id: string;
  kind: 'token' | 'market';
  createdAt: string;
  tokenId?: string;
  marketId?: string;
  symbol: string;
  name: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  market?: MarketSnapshot;
  signals?: SignalResult[];
}

interface WatchlistEnriched {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItemFromAPI[];
}

export default function WatchlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [watchlist, setWatchlist] = useState<WatchlistEnriched | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit metadata state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  // Add token/market state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'token' | 'market'>('token');
  const [addId, setAddId] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Signal filtering state
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('any');
  const [minSeverityFilter, setMinSeverityFilter] = useState<SignalSeverity | 'any'>('any');

  // Get available signal types for dropdown
  const signalCatalog = getSignalCatalog();

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const res = await fetch(`/api/watchlists/enriched/${id}`, {
        cache: 'no-store',
      });

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const json = await res.json();

      if (!json.data?.watchlist) {
        throw new Error(json.error?.message || 'API returned error');
      }

      // The enriched endpoint returns WatchlistEnriched with real signals already computed
      const enrichedWatchlist = json.data.watchlist;
      
      // Flatten the enriched response to match our component's expected format
      const mappedWatchlist: WatchlistEnriched = {
        id: enrichedWatchlist.id,
        name: enrichedWatchlist.name,
        description: enrichedWatchlist.description,
        createdAt: enrichedWatchlist.createdAt,
        updatedAt: enrichedWatchlist.updatedAt,
        items: enrichedWatchlist.items.map((item: WatchlistItemEnriched) => ({
          id: item.id,
          kind: item.kind,
          createdAt: item.createdAt,
          tokenId: item.tokenId,
          marketId: item.marketId,
          symbol: item.symbol,
          name: item.name,
          baseSymbol: item.baseSymbol,
          quoteSymbol: item.quoteSymbol,
          market: item.market,
          signals: item.signals,
        })),
      };

      setWatchlist(mappedWatchlist);
      setEditData({
        name: enrichedWatchlist.name,
        description: enrichedWatchlist.description || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);
      setError(null);

      const res = await fetch(`/api/watchlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-metadata',
          data: {
            name: editData.name,
            description: editData.description || undefined,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update watchlist');
      }

      setShowEditForm(false);
      await fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addId.trim()) return;

    try {
      setUpdating(true);
      setError(null);

      const action = addType === 'token' ? 'add-token' : 'add-market';
      const dataKey = addType === 'token' ? 'tokenId' : 'marketId';

      const res = await fetch(`/api/watchlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: { [dataKey]: addId },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to add item');
      }

      setAddId('');
      setShowAddForm(false);
      await fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the watchlist?')) return;

    try {
      setUpdating(true);
      setError(null);

      const res = await fetch(`/api/watchlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-item',
          data: { itemId },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to remove item');
      }

      await fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteWatchlist = async () => {
    try {
      setUpdating(true);
      setError(null);

      const res = await fetch(`/api/watchlists/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to delete watchlist');
      }

      router.push('/watchlists');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUpdating(false);
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!watchlist) return [];

    // Convert API response items to WatchlistItemEnriched format (flatten market data)
    const itemsWithCorrectFormat: WatchlistItemEnriched[] = watchlist.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      createdAt: item.createdAt,
      tokenId: item.tokenId,
      marketId: item.marketId,
      symbol: item.symbol,
      name: item.name,
      signals: item.signals ?? [],
      baseSymbol: item.baseSymbol,
      quoteSymbol: item.quoteSymbol,
      price: item.market?.price !== null ? item.market?.price : undefined,
      priceChange24h: item.market?.change24hPct !== null ? item.market?.change24hPct : undefined,
      volume24h: item.market?.volume24h !== null ? item.market?.volume24h : undefined,
    }));

    // Apply base filtering (search, kind, sort)
    let result = filterAndSortItems(itemsWithCorrectFormat, {
      query: searchQuery,
      kind: kindFilter,
      sortBy,
      direction: sortDirection,
    });

    // Apply signal type filter
    if (signalTypeFilter !== 'any') {
      result = result.filter((item) =>
        item.signals.some((s) => s.id === signalTypeFilter && s.severity !== 'none')
      );
    }

    // Apply min severity filter
    if (minSeverityFilter !== 'any') {
      result = result.filter((item) =>
        hasSignalAtOrAbove(item.signals, minSeverityFilter)
      );
    }

    return result;
  }, [watchlist, searchQuery, kindFilter, sortBy, sortDirection, signalTypeFilter, minSeverityFilter]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <WatchlistDetailHeaderSkeleton />
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <WatchlistItemSkeleton />
            <WatchlistItemSkeleton />
            <WatchlistItemSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <NotFoundState
        title="Watchlist Not Found"
        message="The watchlist you're looking for doesn't exist or has been deleted."
        backLink="/watchlists"
        backLabel="Back to Watchlists"
      />
    );
  }

  // Error state (non-404)
  if (error && !watchlist) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Watchlist</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage watchlist items</p>
        </div>
        <ErrorState message={error} onRetry={fetchWatchlist} />
      </div>
    );
  }

  if (!watchlist) return null;

  return (
    <div className="space-y-6">
      {/* Error banner at top if there's an error but we have data */}
      {error && watchlist && (
        <ErrorState
          title="Update Failed"
          message={error}
          onRetry={() => setError(null)}
          actionLabel="Dismiss"
        />
      )}

      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold truncate">{watchlist.name}</h1>
              {watchlist.description && (
                <p className="text-sm text-slate-400 mt-1">{watchlist.description}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <Link
                href={`/opportunities?watchlistId=${encodeURIComponent(watchlist.id)}`}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-md transition-colors"
              >
                View in Opportunities
              </Link>
              <button
                onClick={fetchWatchlist}
                disabled={updating}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                aria-label="Refresh"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                disabled={updating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {showEditForm ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updating}
                className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
            <div>
              Created: {new Date(watchlist.createdAt).toLocaleDateString()}
            </div>
            <div>
              Updated: {new Date(watchlist.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Edit form */}
          {showEditForm && (
            <form onSubmit={handleUpdateMetadata} className="border-t border-slate-800 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                  disabled={updating}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  disabled={updating}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Items section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-lg font-medium">Items ({watchlist.items.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={updating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {showAddForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Kind Filter, Sort */}
        {watchlist.items.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Search */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by symbol or name..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Kind filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Show:</label>
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value as KindFilter)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="token">Tokens</option>
                  <option value="market">Markets</option>
                </select>
              </div>

              {/* Sort by */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="changeAbs">24h Change (abs %)</option>
                  <option value="volume">Volume</option>
                </select>
              </div>

              {/* Direction */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-sm text-slate-200 transition-colors flex items-center gap-1.5"
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortDirection === 'asc' ? (
                    <>
                      Asc
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Desc
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Signal type filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Signal:</label>
                <select
                  value={signalTypeFilter}
                  onChange={(e) => setSignalTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any</option>
                  {signalCatalog.map((signal) => (
                    <option key={signal.id} value={signal.id}>
                      {signal.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min severity filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Min Severity:</label>
                <select
                  value={minSeverityFilter}
                  onChange={(e) => setMinSeverityFilter(e.target.value as SignalSeverity | 'any')}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="info">Info</option>
                  <option value="watch">Watch</option>
                  <option value="action">Action</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Add item form */}
        {showAddForm && (
          <form onSubmit={handleAddItem} className="border border-slate-800 rounded-lg p-4 mb-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addType"
                    value="token"
                    checked={addType === 'token'}
                    onChange={(e) => setAddType(e.target.value as 'token' | 'market')}
                    disabled={updating}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-slate-300">Token</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addType"
                    value="market"
                    checked={addType === 'market'}
                    onChange={(e) => setAddType(e.target.value as 'token' | 'market')}
                    disabled={updating}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-slate-300">Market</span>
                </label>
              </div>
              <div>
                <input
                  type="text"
                  value={addId}
                  onChange={(e) => setAddId(e.target.value)}
                  placeholder={
                    addType === 'token'
                      ? 'Enter token ID (e.g., btc, eth)'
                      : 'Enter market ID (e.g., btc-usdt)'
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={updating}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating || !addId.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {updating ? 'Adding...' : `Add ${addType}`}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Items list */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Symbol</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Signals</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">24h %</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">24h Volume</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((item) => {
                  const price = item.price;
                  const change24h = item.priceChange24h;
                  const volume24h = item.volume24h;
                  const primarySignal = getPrimarySignal(item.signals);
                  const signalCount = item.signals.filter((s) => s.severity !== 'none').length;

                  return (
                    <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/assets/${item.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {item.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        <Link
                          href={`/assets/${item.id}`}
                          className="hover:text-slate-100 hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">
                          {item.kind}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {primarySignal ? (
                          <div className="flex items-center gap-2">
                            <SignalBadge signal={primarySignal} />
                            {signalCount > 1 && (
                              <span className="text-xs text-slate-500">+{signalCount - 1}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-slate-100">
                        {price !== null && price !== undefined
                          ? `$${price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        {change24h !== null && change24h !== undefined ? (
                          <span className={change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {change24h >= 0 ? '+' : ''}
                            {change24h.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-300">
                        {volume24h !== null && volume24h !== undefined
                          ? `$${volume24h.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updating}
                          className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-red-400 rounded-md transition-colors"
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : watchlist.items.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">
              No items match your current filters.
            </p>
          </div>
        ) : (
          <EmptyState
            title="No items yet"
            description="Add tokens or markets to this watchlist to start tracking them."
            actionLabel="Add Item"
            onAction={() => setShowAddForm(true)}
            icon="items"
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-red-400 mb-2">Delete Watchlist?</h3>
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete &ldquo;{watchlist.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={updating}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWatchlist}
                disabled={updating}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {updating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

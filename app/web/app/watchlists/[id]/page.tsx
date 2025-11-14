'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { WatchlistItemCard } from '@/components/watchlists/WatchlistItemCard';
import {
  WatchlistDetailHeaderSkeleton,
  WatchlistItemSkeleton,
} from '@/components/watchlists/SkeletonLoader';
import { ErrorState, NotFoundState } from '@/components/watchlists/ErrorState';
import { EmptyState } from '@/components/watchlists/EmptyState';

interface WatchlistItemEnriched {
  id: string;
  kind: 'token' | 'market';
  createdAt: string;
  tokenId?: string;
  marketId?: string;
  symbol: string;
  name: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  baseSymbol?: string;
  quoteSymbol?: string;
}

interface WatchlistEnriched {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItemEnriched[];
}

interface WatchlistResponse {
  success: boolean;
  data?: {
    watchlist: WatchlistEnriched;
  };
  error?: {
    message: string;
  };
}

type SortOption = 'added' | 'symbol' | 'price' | 'change';

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

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('added');

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const res = await fetch(`/api/watchlists/${id}`, {
        cache: 'no-store',
      });

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const json: WatchlistResponse = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'API returned error');
      }

      setWatchlist(json.data.watchlist);
      setEditData({
        name: json.data.watchlist.name,
        description: json.data.watchlist.description || '',
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

  // Sort items based on selected option
  const sortedItems = useMemo(() => {
    if (!watchlist) return [];

    const items = [...watchlist.items];

    switch (sortBy) {
      case 'symbol':
        return items.sort((a, b) => a.symbol.localeCompare(b.symbol));
      case 'price':
        return items.sort((a, b) => {
          if (a.price === undefined) return 1;
          if (b.price === undefined) return -1;
          return b.price - a.price;
        });
      case 'change':
        return items.sort((a, b) => {
          if (a.priceChange24h === undefined) return 1;
          if (b.priceChange24h === undefined) return -1;
          return b.priceChange24h - a.priceChange24h;
        });
      case 'added':
      default:
        return items;
    }
  }, [watchlist, sortBy]);

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
          <div className="flex gap-2 items-center flex-wrap">
            {/* Sort dropdown */}
            {watchlist.items.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-slate-400">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="added">Date Added</option>
                  <option value="symbol">Symbol (A-Z)</option>
                  <option value="price">Price (High-Low)</option>
                  <option value="change">24h Change</option>
                </select>
              </div>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={updating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {showAddForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
        </div>

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
        {sortedItems.length > 0 ? (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <WatchlistItemCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                disabled={updating}
              />
            ))}
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

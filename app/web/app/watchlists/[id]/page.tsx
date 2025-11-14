'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

export default function WatchlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [watchlist, setWatchlist] = useState<WatchlistEnriched | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Edit metadata state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  // Add token/market state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'token' | 'market'>('token');
  const [addId, setAddId] = useState('');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/watchlists/${id}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('Watchlist not found');
          return;
        }
        throw new Error('Failed to fetch watchlist');
      }

      const json: WatchlistResponse = await res.json();

      if (!json.success || !json.data) {
        throw new Error('API returned error');
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
        throw new Error(errorData.error?.message || 'Failed to update');
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
        throw new Error(errorData.error?.message || 'Failed to delete');
      }

      router.push('/watchlists');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/watchlists"
          className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Watchlists
        </Link>
        <div className="text-center py-12 text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error && !watchlist) {
    return (
      <div className="space-y-6">
        <Link
          href="/watchlists"
          className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Watchlists
        </Link>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!watchlist) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/watchlists"
        className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline"
      >
        ← Back to Watchlists
      </Link>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{watchlist.name}</h1>
            {watchlist.description && (
              <p className="text-sm text-slate-400 mt-1">{watchlist.description}</p>
            )}
            <div className="flex gap-4 text-xs text-slate-500 mt-2">
              <span>Created: {new Date(watchlist.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(watchlist.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              disabled={updating}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-sm text-slate-100 rounded-md"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={updating}
              className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 disabled:bg-slate-800 disabled:cursor-not-allowed text-sm text-red-400 rounded-md"
            >
              Delete
            </button>
          </div>
        </div>

        {showEditForm && (
          <form onSubmit={handleUpdateMetadata} className="space-y-3 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={100}
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
                disabled={updating}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updating}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-sm text-white rounded-md"
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={updating}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed text-sm text-slate-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Items ({watchlist.items.length})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={updating}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-sm text-white rounded-md"
        >
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="token"
                  checked={addType === 'token'}
                  onChange={(e) => setAddType(e.target.value as 'token')}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-300">Token</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="market"
                  checked={addType === 'market'}
                  onChange={(e) => setAddType(e.target.value as 'market')}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-300">Market</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {addType === 'token' ? 'Token ID' : 'Market ID'} *
              </label>
              <input
                type="text"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                placeholder={addType === 'token' ? 'e.g., btc' : 'e.g., btc-usdt'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={updating}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updating || !addId.trim()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-sm text-white rounded-md"
              >
                {updating ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddId('');
                }}
                disabled={updating}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed text-sm text-slate-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {watchlist.items.length > 0 ? (
        <div className="space-y-3">
          {watchlist.items.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Added: {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        {item.kind}
                      </div>
                    </div>

                    {/* Main info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {item.kind === 'token' && item.tokenId ? (
                            <Link
                              href={`/tokens/${item.tokenId}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-lg"
                            >
                              {item.symbol}
                            </Link>
                          ) : item.kind === 'market' && item.marketId ? (
                            <Link
                              href={`/markets/${item.marketId}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-lg"
                            >
                              {item.symbol}
                            </Link>
                          ) : (
                            <span className="font-medium text-lg text-slate-300">
                              {item.symbol}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">
                          {item.name}
                        </div>
                      </div>

                      {/* Price and change */}
                      {item.price !== undefined && (
                        <div className="text-right">
                          <div className="text-lg font-medium text-slate-100">
                            ${item.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          {item.priceChange24h !== undefined && (
                            <div
                              className={`text-sm font-medium ${
                                item.priceChange24h >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {item.priceChange24h >= 0 ? '+' : ''}
                              {item.priceChange24h.toFixed(2)}% 24h
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Volume */}
                    {item.volume24h !== undefined && (
                      <div className="text-xs text-slate-400">
                        24h Volume: $
                        {item.volume24h.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={updating}
                    className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:bg-slate-800 disabled:cursor-not-allowed text-red-400 rounded-md"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-4">No items in this watchlist</p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              Add Your First Item
            </button>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Delete Watchlist?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete &quot;{watchlist.name}&quot; and all its items. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteWatchlist}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md"
              >
                {updating ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed text-slate-100 text-sm font-medium rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

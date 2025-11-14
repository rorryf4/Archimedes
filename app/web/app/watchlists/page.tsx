'use client';

import Link from 'next/link';
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

interface WatchlistsResponse {
  success: boolean;
  data: {
    watchlists: WatchlistEnriched[];
  };
}

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<WatchlistEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/watchlists', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch watchlists');
      }

      const json: WatchlistsResponse = await res.json();

      if (!json.success) {
        throw new Error('API returned error');
      }

      setWatchlists(json.data.watchlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to create watchlist');
      }

      // Reset form and refresh list
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      await fetchWatchlists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Watchlists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse your cryptocurrency watchlists
          </p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Watchlists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse your cryptocurrency watchlists
          </p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
        <button
          onClick={fetchWatchlists}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Watchlists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse your cryptocurrency watchlists
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showCreateForm ? 'Cancel' : 'Create Watchlist'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Create New Watchlist</h2>
          <form onSubmit={handleCreateWatchlist} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Watchlist"
                required
                maxLength={100}
                disabled={creating}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
                rows={3}
                maxLength={500}
                disabled={creating}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !formData.name.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '' });
                }}
                disabled={creating}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed text-slate-100 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {watchlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlists.map((watchlist) => {
            const tokenCount = watchlist.items.filter(
              (item) => item.kind === 'token'
            ).length;
            const marketCount = watchlist.items.filter(
              (item) => item.kind === 'market'
            ).length;

            return (
              <Link
                key={watchlist.id}
                href={`/watchlists/${watchlist.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-lg p-6 hover:bg-slate-800 transition-colors"
              >
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-medium text-blue-400">
                      {watchlist.name}
                    </h2>
                    {watchlist.description && (
                      <p className="text-sm text-slate-400 mt-1">
                        {watchlist.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div>
                      <span className="font-medium text-slate-300">
                        {watchlist.items.length}
                      </span>{' '}
                      {watchlist.items.length === 1 ? 'item' : 'items'}
                    </div>

                    {tokenCount > 0 && (
                      <div>
                        <span className="font-medium text-slate-300">
                          {tokenCount}
                        </span>{' '}
                        {tokenCount === 1 ? 'token' : 'tokens'}
                      </div>
                    )}

                    {marketCount > 0 && (
                      <div>
                        <span className="font-medium text-slate-300">
                          {marketCount}
                        </span>{' '}
                        {marketCount === 1 ? 'market' : 'markets'}
                      </div>
                    )}
                  </div>

                  {/* Preview of top items with prices */}
                  {watchlist.items.length > 0 && (
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      {watchlist.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-300">
                              {item.symbol}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {item.name}
                            </span>
                          </div>
                          {item.price !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">
                                ${item.price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {item.priceChange24h !== undefined && (
                                <span
                                  className={`text-xs ${
                                    item.priceChange24h >= 0
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  {item.priceChange24h >= 0 ? '+' : ''}
                                  {item.priceChange24h.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {watchlist.items.length > 3 && (
                        <div className="text-xs text-slate-500 text-center pt-1">
                          +{watchlist.items.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    Created {new Date(watchlist.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-4">No watchlists yet</p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              Create Your First Watchlist
            </button>
          )}
        </div>
      )}
    </div>
  );
}

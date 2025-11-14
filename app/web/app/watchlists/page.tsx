'use client';

import { useState, useEffect } from 'react';
import { WatchlistCard } from '@/components/watchlists/WatchlistCard';
import { WatchlistCardSkeleton } from '@/components/watchlists/SkeletonLoader';
import { ErrorState } from '@/components/watchlists/ErrorState';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Watchlists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse your cryptocurrency watchlists
          </p>
        </div>
        <div className="flex gap-2">
          {!loading && (
            <button
              onClick={fetchWatchlists}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Refresh watchlists"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Watchlist'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={fetchWatchlists}
        />
      )}

      {/* Create form */}
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
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
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed text-slate-100 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WatchlistCardSkeleton />
          <WatchlistCardSkeleton />
          <WatchlistCardSkeleton />
          <WatchlistCardSkeleton />
        </div>
      )}

      {/* Watchlists grid */}
      {!loading && !error && watchlists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlists.map((watchlist) => (
            <WatchlistCard key={watchlist.id} watchlist={watchlist} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && watchlists.length === 0 && (
        <EmptyState
          title="No watchlists yet"
          description="Create your first watchlist to start tracking tokens and markets."
          actionLabel="Create Your First Watchlist"
          onAction={() => setShowCreateForm(true)}
          icon="watchlist"
        />
      )}
    </div>
  );
}

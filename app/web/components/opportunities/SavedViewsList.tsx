'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SavedOpportunityView } from '@/modules/opportunities/savedViews.types';

interface SavedViewsListProps {
  savedViews: SavedOpportunityView[];
  currentViewId?: string;
}

export function buildSavedViewHref(view: SavedOpportunityView): string {
  const params = new URLSearchParams();

  // Use viewId to apply the saved view
  params.set('viewId', view.id);

  const queryString = params.toString();
  return queryString ? `/opportunities?${queryString}` : '/opportunities';
}

export function SavedViewsList({ savedViews, currentViewId }: SavedViewsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredViews = savedViews.filter((view) =>
    view.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;

    await fetch(`/api/saved-views/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() }),
    });

    setEditingId(null);
    setEditingName('');
    router.refresh();
  };

  const handleDuplicate = async (id: string) => {
    await fetch(`/api/saved-views/${id}/duplicate`, {
      method: 'POST',
    });

    setMenuOpenId(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/saved-views/${id}`, {
      method: 'DELETE',
    });

    setMenuOpenId(null);
    setDeletingId(null);

    // If deleting the currently active view, navigate to /opportunities without viewId
    if (currentViewId === id) {
      router.push('/opportunities');
    } else {
      router.refresh();
    }
  };

  const startEditing = (view: SavedOpportunityView) => {
    setEditingId(view.id);
    setEditingName(view.name);
    setMenuOpenId(null);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setMenuOpenId(null);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  // Empty state when no saved views exist
  if (savedViews.length === 0) {
    return (
      <section className="mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Saved Views</h2>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center">
          <p className="text-slate-400 text-sm">
            No saved views yet. Apply filters and save your view to quickly access it later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-300">Saved Views</h2>
          {savedViews.length > 3 && (
            <input
              type="text"
              placeholder="Search views..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          )}
        </div>

        {/* No search results */}
        {filteredViews.length === 0 && searchQuery && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center">
            <p className="text-slate-400 text-sm">
              No views match &ldquo;{searchQuery}&rdquo;.{' '}
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300"
              >
                Clear search
              </button>
            </p>
          </div>
        )}

        {/* Views list */}
        {filteredViews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filteredViews.map((view) => {
              const isActive = currentViewId === view.id;

              return (
                <div key={view.id} className="relative group">
                  {editingId === view.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(view.id);
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-1 text-xs rounded-md bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                        autoFocus
                        onBlur={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                      />
                    </form>
                  ) : (
                    <div className="flex items-center">
                      <Link
                        href={buildSavedViewHref(view)}
                        className={`px-2 py-1 text-xs rounded-l-md transition-colors ${
                          isActive
                            ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                        }`}
                      >
                        {view.name}
                      </Link>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === view.id ? null : view.id)}
                        className={`px-1 py-1 text-xs rounded-r-md border-l transition-colors ${
                          isActive
                            ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border-slate-700'
                        }`}
                        aria-label="View options"
                      >
                        &#8942;
                      </button>

                      {/* Dropdown menu */}
                      {menuOpenId === view.id && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-slate-800 border border-slate-700 rounded-md shadow-lg min-w-[120px]">
                          <button
                            onClick={() => startEditing(view)}
                            className="w-full px-3 py-2 text-left text-xs text-slate-100 hover:bg-slate-700"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDuplicate(view.id)}
                            className="w-full px-3 py-2 text-left text-xs text-slate-100 hover:bg-slate-700"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => confirmDelete(view.id)}
                            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-slate-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Delete View</h2>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this view? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

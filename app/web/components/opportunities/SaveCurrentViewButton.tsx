'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SavedOpportunityViewParams } from '@/modules/opportunities/savedViews.types';

interface SaveCurrentViewButtonProps {
  currentParams: SavedOpportunityViewParams;
}

export function SaveCurrentViewButton({ currentParams }: SaveCurrentViewButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!viewName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: viewName.trim(),
          params: currentParams,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newViewId = result.id;

        // Close modal and reset
        setIsOpen(false);
        setViewName('');

        // Navigate to the new view
        router.push(`/opportunities?viewId=${newViewId}`);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-sm bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors"
      >
        Save Current View
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Save Current View</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="mb-4">
                <label htmlFor="view-name" className="block text-sm text-slate-300 mb-2">
                  View Name
                </label>
                <input
                  id="view-name"
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., High Priority Alerts"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setViewName('');
                  }}
                  className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!viewName.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

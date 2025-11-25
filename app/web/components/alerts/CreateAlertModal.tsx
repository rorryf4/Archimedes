'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SignalCatalogEntry } from '@/modules/signals/catalog';
import type { SignalSeverity } from '@/modules/signals/types';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  signalCatalog: SignalCatalogEntry[];
}

type AlertType = 'signal-threshold' | 'view-trigger';

const SEVERITY_OPTIONS: SignalSeverity[] = ['info', 'watch', 'action'];

export function CreateAlertModal({ isOpen, onClose, signalCatalog }: CreateAlertModalProps) {
  const router = useRouter();
  const [alertType, setAlertType] = useState<AlertType>('signal-threshold');
  const [name, setName] = useState('');
  const [signalId, setSignalId] = useState('');
  const [minSeverity, setMinSeverity] = useState<SignalSeverity>('action');
  const [isSaving, setIsSaving] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAlertType('signal-threshold');
      setName('');
      setSignalId('');
      setMinSeverity('action');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter an alert name');
      return;
    }

    if (alertType === 'signal-threshold' && !signalId) {
      alert('Please select a signal');
      return;
    }

    setIsSaving(true);
    try {
      const body =
        alertType === 'signal-threshold'
          ? {
              kind: 'signal-threshold' as const,
              name: name.trim(),
              signalId,
              minSeverity,
            }
          : {
              kind: 'view-trigger' as const,
              name: name.trim(),
              viewParams: {
                minSeverity,
                signalKeys: [],
                watchlistId: null,
              },
            };

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create Alert</h2>

        <div className="space-y-4">
          {/* Alert Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Alert Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Volume Alerts"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Alert Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAlertType('signal-threshold')}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                  alertType === 'signal-threshold'
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                Signal Threshold
              </button>
              <button
                onClick={() => setAlertType('view-trigger')}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                  alertType === 'view-trigger'
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                View Trigger
              </button>
            </div>
          </div>

          {/* Signal Selection (only for signal-threshold) */}
          {alertType === 'signal-threshold' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Signal</label>
              <select
                value={signalId}
                onChange={(e) => setSignalId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-100"
              >
                <option value="">Select a signal...</option>
                {signalCatalog.map((signal) => (
                  <option key={signal.id} value={signal.id}>
                    {signal.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Min Severity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Minimum Severity
            </label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((severity) => (
                <button
                  key={severity}
                  onClick={() => setMinSeverity(severity)}
                  className={`flex-1 px-3 py-2 rounded-md transition-colors capitalize ${
                    minSeverity === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SignalSeverity } from '@/modules/signals/types';
import type { SignalCatalogEntry } from '@/modules/signals/catalog';
import type { SignalPreference, UserSignalPreferences } from '@/modules/signals/preferences.types';

interface SignalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signalCatalog: SignalCatalogEntry[];
  currentPreferences: UserSignalPreferences | null;
}

const SEVERITY_OPTIONS: { value: SignalSeverity; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'watch', label: 'Watch' },
  { value: 'action', label: 'Action' },
];

export function SignalSettingsModal({
  isOpen,
  onClose,
  signalCatalog,
  currentPreferences,
}: SignalSettingsModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from current preferences or defaults
  const [defaultMinSeverity, setDefaultMinSeverity] = useState<SignalSeverity>(
    currentPreferences?.defaultMinSeverity ?? 'info'
  );
  const [signalPreferences, setSignalPreferences] = useState<SignalPreference[]>(
    currentPreferences?.signalPreferences ?? []
  );

  // Update state when preferences change
  useEffect(() => {
    setDefaultMinSeverity(currentPreferences?.defaultMinSeverity ?? 'info');
    setSignalPreferences(currentPreferences?.signalPreferences ?? []);
  }, [currentPreferences]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSignal = (signalId: string, enabled: boolean) => {
    const existing = signalPreferences.find((p) => p.signalId === signalId);

    if (existing) {
      // Update existing preference
      setSignalPreferences(
        signalPreferences.map((p) =>
          p.signalId === signalId ? { ...p, enabled } : p
        )
      );
    } else {
      // Add new preference
      setSignalPreferences([
        ...signalPreferences,
        { signalId, enabled, minSeverity: null },
      ]);
    }
  };

  const isSignalEnabled = (signalId: string): boolean => {
    const pref = signalPreferences.find((p) => p.signalId === signalId);
    // Default to enabled if no preference exists
    return pref?.enabled ?? true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/signal-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultMinSeverity,
          signalPreferences,
        }),
      });

      if (response.ok) {
        onClose();
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Signal Settings</h2>
              <p className="text-slate-400 text-sm mt-1">
                Configure default filters and enable/disable signals
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Default Min Severity */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Default Minimum Severity
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Only show opportunities with signals at or above this severity level
            </p>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDefaultMinSeverity(option.value)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    defaultMinSeverity === option.value
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Signal Enable/Disable */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Enabled Signals
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Toggle signals on/off to show or hide them from opportunities
            </p>
            <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-slate-700">
              {signalCatalog.map((signal) => {
                const enabled = isSignalEnabled(signal.id);
                return (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{signal.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{signal.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSignal(signal.id, !enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

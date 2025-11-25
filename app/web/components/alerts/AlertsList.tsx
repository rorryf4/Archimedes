'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserAlert } from '@/modules/alerts/types';
import type { SignalCatalogEntry } from '@/modules/signals/catalog';
import { CreateAlertModal } from './CreateAlertModal';

interface AlertsListProps {
  alerts: UserAlert[];
  signalCatalog: SignalCatalogEntry[];
}

export function AlertsList({ alerts, signalCatalog }: AlertsListProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    setDeletingAlertId(alertId);
    try {
      const response = await fetch('/api/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    } finally {
      setDeletingAlertId(null);
    }
  };

  const handleToggleEnabled = async (userAlert: UserAlert) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: userAlert.id,
          enabled: !userAlert.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alert');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Failed to update alert');
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Create Alert Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Create Alert
        </button>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400">
              No alerts yet. Create an alert to get notified when opportunities match your criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{alert.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        alert.kind === 'signal-threshold'
                          ? 'bg-purple-900/50 text-purple-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {alert.kind === 'signal-threshold' ? 'Signal Threshold' : 'View Trigger'}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        alert.enabled
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {alert.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {alert.kind === 'signal-threshold' ? (
                      <>
                        Signal: {signalCatalog.find((s) => s.id === alert.signalId)?.label || alert.signalId} •
                        Min Severity: {alert.minSeverity}
                      </>
                    ) : (
                      <>
                        View Trigger • Min Severity: {alert.viewParams.minSeverity}
                        {alert.viewParams.signalKeys.length > 0 &&
                          ` • Signals: ${alert.viewParams.signalKeys.join(', ')}`}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(alert)}
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
                  >
                    {alert.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    disabled={deletingAlertId === alert.id}
                    className="px-3 py-1.5 text-sm bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingAlertId === alert.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        signalCatalog={signalCatalog}
      />
    </>
  );
}

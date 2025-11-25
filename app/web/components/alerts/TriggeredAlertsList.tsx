'use client';

import type { TriggeredAlertEvent } from '@/modules/alerts/events.types';

interface TriggeredAlertsListProps {
  events: TriggeredAlertEvent[];
}

export function TriggeredAlertsList({ events }: TriggeredAlertsListProps) {
  if (events.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
        <p className="text-slate-400">No triggered events yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Time</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Alert</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Opportunity</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-sm text-slate-300">
                {new Date(event.triggeredAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm font-medium">{event.alertName}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    event.alertKind === 'signal-threshold'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}
                >
                  {event.alertKind === 'signal-threshold' ? 'Signal' : 'View'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{event.opportunitySymbol}</div>
                  <div className="text-xs text-slate-400">{event.opportunityName}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">
                {event.triggeringSignalId || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

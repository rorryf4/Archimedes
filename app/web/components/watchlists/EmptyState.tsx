// app/web/components/watchlists/EmptyState.tsx

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'watchlist' | 'items';
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'watchlist',
}: EmptyStateProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-center">
          {icon === 'watchlist' ? (
            <svg
              className="w-16 h-16 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          ) : (
            <svg
              className="w-16 h-16 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>
        {actionLabel && onAction && (
          <div>
            <button
              onClick={onAction}
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// app/web/components/watchlists/ErrorState.tsx

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  actionLabel = 'Retry',
}: ErrorStateProps) {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-400 mb-1">{title}</h3>
          <p className="text-sm text-red-300">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFoundState({
  title = 'Not Found',
  message,
  backLink,
  backLabel = 'Go Back',
}: {
  title?: string;
  message: string;
  backLink?: string;
  backLabel?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-center">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">{title}</h2>
          <p className="text-slate-400">{message}</p>
        </div>
        {backLink && (
          <div>
            <a
              href={backLink}
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              {backLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

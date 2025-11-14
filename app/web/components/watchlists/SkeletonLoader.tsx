// app/web/components/watchlists/SkeletonLoader.tsx

export function WatchlistCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 animate-pulse">
      <div className="space-y-3">
        <div>
          <div className="h-6 bg-slate-800 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-800 rounded w-full"></div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-4 bg-slate-800 rounded w-20"></div>
          <div className="h-4 bg-slate-800 rounded w-16"></div>
          <div className="h-4 bg-slate-800 rounded w-16"></div>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-16"></div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
            </div>
            <div className="h-4 bg-slate-800 rounded w-24"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-16"></div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
            </div>
            <div className="h-4 bg-slate-800 rounded w-24"></div>
          </div>
        </div>

        <div className="h-3 bg-slate-800 rounded w-32"></div>
      </div>
    </div>
  );
}

export function WatchlistItemSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-800 rounded w-32"></div>
            <div className="h-3 bg-slate-800 rounded w-16"></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-slate-800 rounded w-24 mb-2"></div>
              <div className="h-4 bg-slate-800 rounded w-32"></div>
            </div>
            <div className="text-right">
              <div className="h-6 bg-slate-800 rounded w-28 mb-2"></div>
              <div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div>
            </div>
          </div>

          <div className="h-3 bg-slate-800 rounded w-40"></div>
        </div>

        <div className="h-8 bg-slate-800 rounded w-16"></div>
      </div>
    </div>
  );
}

export function WatchlistDetailHeaderSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 bg-slate-800 rounded w-48 mb-2"></div>
            <div className="h-4 bg-slate-800 rounded w-full max-w-md"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-slate-800 rounded w-16"></div>
            <div className="h-9 bg-slate-800 rounded w-20"></div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="h-4 bg-slate-800 rounded w-32"></div>
          <div className="h-4 bg-slate-800 rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}

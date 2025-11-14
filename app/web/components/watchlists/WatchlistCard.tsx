// app/web/components/watchlists/WatchlistCard.tsx
import Link from 'next/link';

interface WatchlistItemEnriched {
  id: string;
  kind: 'token' | 'market';
  symbol: string;
  name: string;
  price?: number;
  priceChange24h?: number;
}

interface WatchlistCardProps {
  watchlist: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    items: WatchlistItemEnriched[];
  };
}

export function WatchlistCard({ watchlist }: WatchlistCardProps) {
  const tokenCount = watchlist.items.filter((item) => item.kind === 'token').length;
  const marketCount = watchlist.items.filter((item) => item.kind === 'market').length;

  return (
    <Link
      href={`/watchlists/${watchlist.id}`}
      className="block bg-slate-900 border border-slate-800 rounded-lg p-6 hover:bg-slate-800 hover:border-slate-700 transition-all duration-200"
    >
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-blue-400 hover:text-blue-300 transition-colors">
            {watchlist.name}
          </h2>
          {watchlist.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {watchlist.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div>
            <span className="font-medium text-slate-300">
              {watchlist.items.length}
            </span>{' '}
            {watchlist.items.length === 1 ? 'item' : 'items'}
          </div>

          {tokenCount > 0 && (
            <div>
              <span className="font-medium text-slate-300">{tokenCount}</span>{' '}
              {tokenCount === 1 ? 'token' : 'tokens'}
            </div>
          )}

          {marketCount > 0 && (
            <div>
              <span className="font-medium text-slate-300">{marketCount}</span>{' '}
              {marketCount === 1 ? 'market' : 'markets'}
            </div>
          )}
        </div>

        {/* Preview of top items with prices */}
        {watchlist.items.length > 0 && (
          <div className="border-t border-slate-800 pt-3 space-y-2">
            {watchlist.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-slate-300 flex-shrink-0">
                    {item.symbol}
                  </span>
                  <span className="text-slate-500 text-xs truncate">
                    {item.name}
                  </span>
                </div>
                {item.price !== undefined && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-300">
                      ${item.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {item.priceChange24h !== undefined && (
                      <span
                        className={`text-xs font-medium ${
                          item.priceChange24h >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {item.priceChange24h >= 0 ? '+' : ''}
                        {item.priceChange24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {watchlist.items.length > 3 && (
              <div className="text-xs text-slate-500 text-center pt-1">
                +{watchlist.items.length - 3} more
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500">
          Created {new Date(watchlist.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}

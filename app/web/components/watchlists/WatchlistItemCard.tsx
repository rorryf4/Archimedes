// app/web/components/watchlists/WatchlistItemCard.tsx
import Link from 'next/link';

interface WatchlistItemCardProps {
  item: {
    id: string;
    kind: 'token' | 'market';
    createdAt: string;
    tokenId?: string;
    marketId?: string;
    symbol: string;
    name: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
  };
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

export function WatchlistItemCard({ item, onRemove, disabled }: WatchlistItemCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-slate-500">
              Added: {new Date(item.createdAt).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              {item.kind}
            </div>
          </div>

          {/* Main info */}
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="min-w-0 flex-shrink">
              <div className="flex items-center gap-2">
                {item.kind === 'token' && item.tokenId ? (
                  <Link
                    href={`/tokens/${item.tokenId}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-lg"
                  >
                    {item.symbol}
                  </Link>
                ) : item.kind === 'market' && item.marketId ? (
                  <Link
                    href={`/markets/${item.marketId}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-lg"
                  >
                    {item.symbol}
                  </Link>
                ) : (
                  <span className="font-medium text-lg text-slate-300">
                    {item.symbol}
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-sm mt-1 truncate">
                {item.name}
              </div>
            </div>

            {/* Price and change */}
            {item.price !== undefined && (
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-medium text-slate-100">
                  ${item.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {item.priceChange24h !== undefined && (
                  <div
                    className={`text-sm font-medium ${
                      item.priceChange24h >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {item.priceChange24h >= 0 ? '+' : ''}
                    {item.priceChange24h.toFixed(2)}% 24h
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Volume */}
          {item.volume24h !== undefined && (
            <div className="text-xs text-slate-400">
              24h Volume: $
              {item.volume24h.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-red-400 rounded-md transition-colors flex-shrink-0"
          aria-label="Remove item"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

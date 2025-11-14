import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface Market {
  id: string;
  baseTokenId: string;
  quoteTokenId: string;
  venue: string;
  status: string;
  baseToken: Token;
  quoteToken: Token;
}

interface WatchlistWithRelations {
  id: string;
  name: string;
  items: Array<{
    id: string;
    createdAt: string;
    token?: Token;
    market?: Market;
  }>;
}

interface WatchlistResponse {
  success: boolean;
  data?: {
    watchlist: WatchlistWithRelations;
  };
  error?: {
    message: string;
  };
}

async function getWatchlist(id: string): Promise<WatchlistWithRelations> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/watchlists/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch watchlist');
  }

  const json: WatchlistResponse = await res.json();

  if (!json.success || !json.data) {
    throw new Error('API returned error');
  }

  return json.data.watchlist;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchlistDetailPage({ params }: PageProps) {
  const { id } = await params;
  const watchlist = await getWatchlist(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/watchlists"
          className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline mb-4"
        >
          ← Back to Watchlists
        </Link>

        <h1 className="text-2xl font-semibold">{watchlist.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {watchlist.items.length} {watchlist.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {watchlist.items.length > 0 ? (
        <div className="space-y-3">
          {watchlist.items.map((item) => {
            const hasToken = item.token !== undefined;
            const hasMarket = item.market !== undefined;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4"
              >
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Added: {new Date(item.createdAt).toLocaleString()}
                  </div>

                  {hasToken && item.token && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        Token
                      </div>
                      <div>
                        <Link
                          href={`/tokens/${item.token.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {item.token.symbol}
                        </Link>
                        <span className="text-slate-400 ml-2">
                          {item.token.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {hasMarket && item.market && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        Market
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/markets/${item.market.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {item.market.baseToken.symbol} /{' '}
                          {item.market.quoteToken.symbol}
                        </Link>
                        <span className="text-slate-400 text-sm">
                          {item.market.venue}
                        </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.market.status === 'ACTIVE'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.market.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {!hasToken && !hasMarket && (
                    <div className="text-slate-500 text-sm">
                      Unresolved item
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No items in this watchlist
        </div>
      )}
    </div>
  );
}

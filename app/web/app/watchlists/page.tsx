import Link from 'next/link';

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

interface WatchlistsResponse {
  success: boolean;
  data: {
    watchlists: WatchlistWithRelations[];
  };
}

async function getWatchlists(): Promise<WatchlistWithRelations[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/watchlists`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch watchlists');
  }

  const json: WatchlistsResponse = await res.json();

  if (!json.success) {
    throw new Error('API returned error');
  }

  return json.data.watchlists;
}

export default async function WatchlistsPage() {
  const watchlists = await getWatchlists();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Watchlists</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse your cryptocurrency watchlists
        </p>
      </div>

      {watchlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlists.map((watchlist) => {
            const tokenCount = watchlist.items.filter(
              (item) => item.token
            ).length;
            const marketCount = watchlist.items.filter(
              (item) => item.market
            ).length;

            return (
              <Link
                key={watchlist.id}
                href={`/watchlists/${watchlist.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-lg p-6 hover:bg-slate-800 transition-colors"
              >
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-medium text-blue-400">
                      {watchlist.name}
                    </h2>
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
                        <span className="font-medium text-slate-300">
                          {tokenCount}
                        </span>{' '}
                        {tokenCount === 1 ? 'token' : 'tokens'}
                      </div>
                    )}

                    {marketCount > 0 && (
                      <div>
                        <span className="font-medium text-slate-300">
                          {marketCount}
                        </span>{' '}
                        {marketCount === 1 ? 'market' : 'markets'}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No watchlists available
        </div>
      )}
    </div>
  );
}

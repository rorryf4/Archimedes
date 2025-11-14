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

interface MarketsResponse {
  success: boolean;
  data: {
    markets: Market[];
  };
}

async function getMarkets(): Promise<Market[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/markets`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch markets');
  }

  const json: MarketsResponse = await res.json();

  if (!json.success) {
    throw new Error('API returned error');
  }

  return json.data.markets;
}

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MarketsPage({ searchParams }: PageProps) {
  const allMarkets = await getMarkets();
  const params = await searchParams;

  // Extract filter params
  const baseFilter = params?.base
    ? String(params.base).toLowerCase()
    : undefined;
  const quoteFilter = params?.quote
    ? String(params.quote).toLowerCase()
    : undefined;
  const venueFilter = params?.venue ? String(params.venue) : undefined;
  const statusFilter = params?.status ? String(params.status) : undefined;

  // Apply filters
  let markets = allMarkets;

  if (baseFilter) {
    markets = markets.filter(
      (m) => m.baseToken.symbol.toLowerCase() === baseFilter
    );
  }

  if (quoteFilter) {
    markets = markets.filter(
      (m) => m.quoteToken.symbol.toLowerCase() === quoteFilter
    );
  }

  if (venueFilter) {
    markets = markets.filter((m) => m.venue === venueFilter);
  }

  if (statusFilter) {
    markets = markets.filter((m) => m.status === statusFilter);
  }

  const hasFilters = baseFilter || quoteFilter || venueFilter || statusFilter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse available cryptocurrency markets
        </p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <form method="GET" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="base"
                className="block text-xs text-slate-400 uppercase tracking-wide mb-1"
              >
                Base Token
              </label>
              <input
                type="text"
                id="base"
                name="base"
                defaultValue={baseFilter}
                placeholder="e.g., BTC"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="quote"
                className="block text-xs text-slate-400 uppercase tracking-wide mb-1"
              >
                Quote Token
              </label>
              <input
                type="text"
                id="quote"
                name="quote"
                defaultValue={quoteFilter}
                placeholder="e.g., USDT"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="venue"
                className="block text-xs text-slate-400 uppercase tracking-wide mb-1"
              >
                Venue
              </label>
              <select
                id="venue"
                name="venue"
                defaultValue={venueFilter || ''}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="SIMULATED">SIMULATED</option>
                <option value="BINANCE">BINANCE</option>
                <option value="COINBASE">COINBASE</option>
                <option value="KRAKEN">KRAKEN</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs text-slate-400 uppercase tracking-wide mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || ''}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            {hasFilters && (
              <Link
                href="/markets"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                Clear Filters
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Market
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Base
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Quote
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Venue
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <tr
                key={market.id}
                className="border-b border-slate-800 hover:bg-slate-900"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/markets/${market.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {market.baseToken.symbol} / {market.quoteToken.symbol}
                  </Link>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {market.baseToken.symbol}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {market.quoteToken.symbol}
                </td>
                <td className="py-3 px-4 text-slate-300">{market.venue}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      market.status === 'ACTIVE'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {market.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {markets.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {hasFilters ? 'No markets found matching filters' : 'No markets available'}
        </div>
      )}
    </div>
  );
}

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

export default async function MarketsPage() {
  const markets = await getMarkets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse available cryptocurrency markets
        </p>
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
          No markets available
        </div>
      )}
    </div>
  );
}

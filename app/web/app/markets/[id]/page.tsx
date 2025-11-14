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

interface PriceFeed {
  marketId: string;
  price: number;
  timestamp: string;
}

interface MarketDetailSuccessResponse {
  success: true;
  data: {
    market: Market;
    latestPriceFeed: PriceFeed | null;
  };
}

interface MarketDetailErrorResponse {
  success: false;
  error: {
    message: string;
  };
}

type MarketDetailResponse =
  | MarketDetailSuccessResponse
  | MarketDetailErrorResponse;

async function getMarketDetail(
  id: string
): Promise<MarketDetailSuccessResponse['data'] | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/markets/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const json: MarketDetailResponse = await res.json();

  if (!json.success) {
    return null;
  }

  return json.data;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getMarketDetail(id);

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Market Not Found</h1>
          <p className="text-sm text-slate-400 mt-1">
            The market you are looking for does not exist.
          </p>
        </div>

        <Link
          href="/markets"
          className="inline-block text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const { market, latestPriceFeed } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/markets"
          className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline mb-4"
        >
          ← Back to Markets
        </Link>

        <h1 className="text-2xl font-semibold">
          {market.baseToken.symbol} / {market.quoteToken.symbol}
        </h1>
        <p className="text-sm text-slate-400 mt-1">Market Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Market Information</h2>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Market ID
              </div>
              <div className="text-sm mt-1">{market.id}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Venue
              </div>
              <div className="text-sm mt-1">{market.venue}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    market.status === 'ACTIVE'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {market.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Token Details</h2>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Base Token
              </div>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-slate-400">Symbol:</span>{' '}
                  {market.baseToken.symbol}
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Name:</span>{' '}
                  {market.baseToken.name}
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Decimals:</span>{' '}
                  {market.baseToken.decimals}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Quote Token
              </div>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-slate-400">Symbol:</span>{' '}
                  {market.quoteToken.symbol}
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Name:</span>{' '}
                  {market.quoteToken.name}
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Decimals:</span>{' '}
                  {market.quoteToken.decimals}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {latestPriceFeed && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Latest Price</h2>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Price
              </div>
              <div className="text-2xl font-semibold mt-1">
                {latestPriceFeed.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}{' '}
                <span className="text-lg text-slate-400">
                  {market.quoteToken.symbol}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Last Updated
              </div>
              <div className="text-sm mt-1">
                {new Date(latestPriceFeed.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {!latestPriceFeed && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
          No price feed available for this market
        </div>
      )}
    </div>
  );
}

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

interface TokensResponse {
  success: boolean;
  data: {
    tokens: Token[];
  };
}

interface MarketsResponse {
  success: boolean;
  data: {
    markets: Market[];
  };
}

async function getTokens(): Promise<Token[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/tokens`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const json: TokensResponse = await res.json();

  if (!json.success) {
    return [];
  }

  return json.data.tokens;
}

async function getMarkets(): Promise<Market[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/markets`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const json: MarketsResponse = await res.json();

  if (!json.success) {
    return [];
  }

  return json.data.markets;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TokenDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [tokens, markets] = await Promise.all([getTokens(), getMarkets()]);

  const token = tokens.find((t) => t.id === id);

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Token Not Found</h1>
          <p className="text-sm text-slate-400 mt-1">
            The token you are looking for does not exist.
          </p>
        </div>

        <Link
          href="/tokens"
          className="inline-block text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Tokens
        </Link>
      </div>
    );
  }

  const relatedMarkets = markets.filter(
    (m) => m.baseTokenId === token.id || m.quoteTokenId === token.id
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tokens"
          className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline mb-4"
        >
          ← Back to Tokens
        </Link>

        <h1 className="text-2xl font-semibold">{token.symbol}</h1>
        <p className="text-sm text-slate-400 mt-1">{token.name}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Token Information</h2>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Symbol
            </div>
            <div className="text-sm mt-1">{token.symbol}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Name
            </div>
            <div className="text-sm mt-1">{token.name}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Decimals
            </div>
            <div className="text-sm mt-1">{token.decimals}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Related Markets</h2>

        {relatedMarkets.length > 0 ? (
          <div className="space-y-2">
            {relatedMarkets.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="block p-3 rounded-md border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-400">
                      {market.baseToken.symbol} / {market.quoteToken.symbol}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {market.venue}
                    </div>
                  </div>
                  <div>
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No markets available for this token
          </div>
        )}
      </div>
    </div>
  );
}

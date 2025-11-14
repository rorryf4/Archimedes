import Link from 'next/link';

interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface TokensResponse {
  success: boolean;
  data: {
    tokens: Token[];
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
    throw new Error('Failed to fetch tokens');
  }

  const json: TokensResponse = await res.json();

  if (!json.success) {
    throw new Error('API returned error');
  }

  return json.data.tokens;
}

export default async function TokensPage() {
  const tokens = await getTokens();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tokens</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse available cryptocurrency tokens
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Symbol
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">
                Decimals
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr
                key={token.id}
                className="border-b border-slate-800 hover:bg-slate-900"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/tokens/${token.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {token.symbol}
                  </Link>
                </td>
                <td className="py-3 px-4 text-slate-300">{token.name}</td>
                <td className="py-3 px-4 text-slate-300">{token.decimals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tokens.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No tokens available
        </div>
      )}
    </div>
  );
}

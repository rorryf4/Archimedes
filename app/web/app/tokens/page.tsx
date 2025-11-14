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

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TokensPage({ searchParams }: PageProps) {
  const allTokens = await getTokens();
  const params = await searchParams;

  // Extract search query
  const query = params?.q ? String(params.q).toLowerCase() : '';

  // Apply search filter
  let tokens = allTokens;

  if (query) {
    tokens = tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    );
  }

  const hasSearch = query.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tokens</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse available cryptocurrency tokens
        </p>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <form method="GET" className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              Search tokens
            </label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Search by symbol or name..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          {hasSearch && (
            <Link
              href="/tokens"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              Clear
            </Link>
          )}
        </form>
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
          {hasSearch ? 'No tokens found matching search' : 'No tokens available'}
        </div>
      )}
    </div>
  );
}

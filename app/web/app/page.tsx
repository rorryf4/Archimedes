import Link from 'next/link';
import {
  getWatchlistSummaries,
  getTopMoversEnrichedWithSignals,
} from '../modules/watchlists/dashboard';
import { TopMoversPanel } from '../components/dashboard/TopMoversPanel';

export default async function DashboardPage() {
  const summaries = getWatchlistSummaries();
  const topMovers = await getTopMoversEnrichedWithSignals(10);

  return (
    <div className="p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">My Watchlists</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold">{summary.name}</h2>
                <Link
                  href={`/watchlists/${summary.id}`}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View
                </Link>
              </div>
              {summary.description && (
                <p className="text-sm text-slate-400 mb-3">
                  {summary.description}
                </p>
              )}
              <div className="text-sm text-slate-500">
                <div>{summary.itemCount} items</div>
                <div className="mt-1">
                  Created: {new Date(summary.createdAt).toLocaleDateString()}
                </div>
                <div>
                  Updated: {new Date(summary.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h1 className="text-2xl font-bold mb-4">Top Movers (24h)</h1>
        <TopMoversPanel initialMovers={topMovers} />
      </section>
    </div>
  );
}

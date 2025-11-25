import { ok, error } from '@/lib/api/response';
import { listWatchlistsEnriched } from '@/modules/watchlists';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const watchlists = await listWatchlistsEnriched();

    return ok({
      watchlists,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

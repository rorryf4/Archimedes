import { ok, error } from '@/lib/api/response';
import { getWatchlistEnriched } from '@/modules/watchlists';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const watchlist = await getWatchlistEnriched(id);

    if (!watchlist) {
      return error('Watchlist not found', 404);
    }

    return ok({
      watchlist,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

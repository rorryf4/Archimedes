import { ok, error } from '@/lib/api/response';
import { enrichWatchlist, enrichWatchlists, getCurrentUserContext } from '@/modules/watchlists';
import * as repository from '@/modules/watchlists/repository';
import { CreateWatchlistInputSchema } from '@/modules/watchlists/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const context = getCurrentUserContext();
  const rawWatchlists = await repository.listWatchlists(context);
  const watchlists = enrichWatchlists(rawWatchlists);

  return ok({
    watchlists,
  });
}

export async function POST(request: Request) {
  try {
    const context = getCurrentUserContext();
    const body = await request.json();

    const validation = CreateWatchlistInputSchema.safeParse(body);

    if (!validation.success) {
      return error('Invalid input', 400, {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const rawWatchlist = await repository.createWatchlist(context, validation.data);
    const watchlist = enrichWatchlist(rawWatchlist);

    return ok({ watchlist }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

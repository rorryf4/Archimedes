import { ok, error } from '@/lib/api/response';
import { enrichWatchlist, getCurrentUserContext } from '@/modules/watchlists';
import * as repository from '@/modules/watchlists/repository';
import { PatchWatchlistInputSchema } from '@/modules/watchlists/validation';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: Params) {
  const context = getCurrentUserContext();
  const { id } = await params;
  const rawWatchlist = await repository.getWatchlistById(context, id);

  if (!rawWatchlist) {
    return error('Watchlist not found', 404);
  }

  const watchlist = enrichWatchlist(rawWatchlist);

  return ok({
    watchlist,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const context = getCurrentUserContext();
    const { id } = await params;
    const body = await request.json();

    const validation = PatchWatchlistInputSchema.safeParse(body);

    if (!validation.success) {
      return error('Invalid input', 400, {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    let rawWatchlist: Awaited<ReturnType<typeof repository.getWatchlistById>>;

    switch (data.action) {
      case 'update-metadata':
        rawWatchlist = await repository.updateWatchlist(context, id, data.data);
        break;

      case 'add-token':
        rawWatchlist = await repository.addTokenToWatchlist(
          context,
          id,
          data.data.tokenId
        );
        break;

      case 'add-market':
        rawWatchlist = await repository.addMarketToWatchlist(
          context,
          id,
          data.data.marketId
        );
        break;

      case 'remove-item':
        rawWatchlist = await repository.removeItemFromWatchlist(
          context,
          id,
          data.data.itemId
        );
        break;

      default:
        return error('Invalid action', 400);
    }

    if (!rawWatchlist) {
      return error('Watchlist not found', 404);
    }

    const watchlist = enrichWatchlist(rawWatchlist);

    return ok({ watchlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const context = getCurrentUserContext();
    const { id } = await params;

    await repository.deleteWatchlist(context, id);

    return ok({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message === 'Watchlist not found') {
      return error(message, 404);
    }

    return error(message, 500);
  }
}

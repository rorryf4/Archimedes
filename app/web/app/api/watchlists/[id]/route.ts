import { ok, error } from '@/lib/api/response';
import { enrichWatchlist } from '@/modules/watchlists';
import * as repository from '@/modules/watchlists/repository';
import { PatchWatchlistInputSchema } from '@/modules/watchlists/validation';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const rawWatchlist = await repository.getWatchlistById(id);

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
    const { id } = await params;
    const body = await request.json();

    const validation = PatchWatchlistInputSchema.safeParse(body);

    if (!validation.success) {
      return error('Invalid input', 400, {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    let watchlist: Awaited<ReturnType<typeof repository.getWatchlistById>>;

    switch (data.action) {
      case 'update-metadata':
        watchlist = await repository.updateWatchlist(id, data.data);
        break;

      case 'add-token':
        watchlist = await repository.addTokenToWatchlist(
          id,
          data.data.tokenId
        );
        break;

      case 'add-market':
        watchlist = await repository.addMarketToWatchlist(
          id,
          data.data.marketId
        );
        break;

      case 'remove-item':
        watchlist = await repository.removeItemFromWatchlist(
          id,
          data.data.itemId
        );
        break;

      default:
        return error('Invalid action', 400);
    }

    if (!watchlist) {
      return error('Watchlist not found', 404);
    }

    return ok({ watchlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;

    await repository.deleteWatchlist(id);

    return ok({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message === 'Watchlist not found') {
      return error(message, 404);
    }

    return error(message, 500);
  }
}

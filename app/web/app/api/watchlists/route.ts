import { ok, error } from '@/lib/api/response';
import { listWatchlistsWithRelations } from '@/modules/watchlists';
import * as repository from '@/modules/watchlists/repository';
import { CreateWatchlistInputSchema } from '@/modules/watchlists/validation';

export const dynamic = 'force-dynamic';

export function GET() {
  const watchlists = listWatchlistsWithRelations();

  return ok({
    watchlists,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = CreateWatchlistInputSchema.safeParse(body);

    if (!validation.success) {
      return error('Invalid input', 400, {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const watchlist = await repository.createWatchlist(validation.data);

    return ok({ watchlist }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return error(message, 500);
  }
}

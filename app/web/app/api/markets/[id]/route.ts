// app/web/app/api/markets/[id]/route.ts
import { ok, error } from '@/lib/api/response';
import { getMarketById, getLatestPriceFeedForMarket } from '@/modules/markets';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const market = getMarketById(id);
  if (!market) {
    return error('Market not found', 404);
  }

  const latestPriceFeed = getLatestPriceFeedForMarket(id);

  return ok({
    market,
    latestPriceFeed: latestPriceFeed ?? null,
  });
}

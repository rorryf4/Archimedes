// app/web/app/api/markets/route.ts
import { ok } from '@/lib/api/response';
import { listMarkets } from '@/modules/markets';

export const dynamic = 'force-dynamic';

export function GET() {
  const markets = listMarkets();

  return ok({
    markets,
  });
}

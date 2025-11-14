// app/web/app/api/tokens/route.ts
import { ok } from '@/lib/api/response';
import { listTokens } from '@/modules/markets';

export const dynamic = 'force-dynamic';

export function GET() {
  const tokens = listTokens();

  return ok({
    tokens,
  });
}

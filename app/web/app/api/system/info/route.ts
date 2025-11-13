import { ok } from '@/lib/api/response';
import { getSystemInfo } from '@/modules/system';

export const dynamic = 'force-dynamic';

export function GET() {
  return ok(getSystemInfo());
}

import { NextResponse } from 'next/server';
import { getMarketDataProvider } from '@/modules/markets/marketData';
import { listWatchlists } from '@/modules/watchlists/service';

export const dynamic = 'force-dynamic';

export type ComponentStatus = 'ok' | 'error' | 'not_configured';
export type OverallStatus = 'ok' | 'degraded';

export interface HealthCheckResponse {
  status: OverallStatus;
  components: {
    marketDataProvider: ComponentStatus;
    db: ComponentStatus;
  };
  timestamp: string;
}

async function checkMarketDataProvider(): Promise<ComponentStatus> {
  try {
    const provider = getMarketDataProvider();
    if (!provider) {
      return 'not_configured';
    }
    // Try a basic operation to verify the provider works
    await provider.getSnapshot({ kind: 'token', token: 'health-check' });
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkDatabase(): Promise<ComponentStatus> {
  try {
    // Use listWatchlists as a trivial read to verify data access works
    listWatchlists();
    return 'ok';
  } catch {
    return 'error';
  }
}

function computeOverallStatus(
  components: Record<string, ComponentStatus>
): OverallStatus {
  const hasError = Object.values(components).some((s) => s === 'error');
  return hasError ? 'degraded' : 'ok';
}

export async function GET() {
  const [marketDataProvider, db] = await Promise.all([
    checkMarketDataProvider(),
    checkDatabase(),
  ]);

  const components = {
    marketDataProvider,
    db,
  };

  const response: HealthCheckResponse = {
    status: computeOverallStatus(components),
    components,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

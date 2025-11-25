export type MarketSnapshot = {
  price: number | null;
  change24hPct: number | null;
  volume24h: number | null;
  lastUpdated: string | null;
  source: string | null;
};

export type MarketQuery =
  | { kind: "token"; token: string }
  | { kind: "market"; market: string };

export interface MarketDataProvider {
  getSnapshot(query: MarketQuery): Promise<MarketSnapshot | null>;
  getSnapshots(
    queries: MarketQuery[]
  ): Promise<Map<string, MarketSnapshot | null>>;
}

class FakeMarketDataProvider implements MarketDataProvider {
  async getSnapshot(query: MarketQuery): Promise<MarketSnapshot | null> {
    const key = query.kind === "token" ? query.token : query.market;
    return this.generateFakeSnapshot(key);
  }

  async getSnapshots(
    queries: MarketQuery[]
  ): Promise<Map<string, MarketSnapshot | null>> {
    const results = new Map<string, MarketSnapshot | null>();

    for (const query of queries) {
      const key = query.kind === "token" ? query.token : query.market;
      results.set(key, this.generateFakeSnapshot(key));
    }

    return results;
  }

  private generateFakeSnapshot(key: string): MarketSnapshot {
    const hash = this.simpleHash(key);

    return {
      price: 100 + (hash % 10000) / 100,
      change24hPct: -10 + (hash % 2000) / 100,
      volume24h: 1000000 + (hash % 50000000),
      lastUpdated: new Date().toISOString(),
      source: "fake",
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export function getMarketDataProvider(): MarketDataProvider {
  return new FakeMarketDataProvider();
}
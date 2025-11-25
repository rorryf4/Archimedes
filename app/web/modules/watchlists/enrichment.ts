// app/web/modules/watchlists/enrichment.ts
import { getMarketDataProvider } from '../markets/marketData';
import type {
  MarketDataProvider,
  MarketQuery,
  MarketSnapshot,
} from '../markets/marketData';
import { listTokens, getMarketById } from '../markets';
import type {
  Watchlist,
  WatchlistEnriched,
  WatchlistItemEnriched,
} from './types';
import {
  runBuiltinSignalsForSnapshot,
} from '../signals';
import type { SignalResult } from '../signals';

/**
 * Build a stable key for mapping snapshots back to items
 */
function buildSnapshotKey(item: Watchlist['items'][number]): string {
  if (item.tokenId) {
    return `token:${item.tokenId}`;
  }
  if (item.marketId) {
    return `market:${item.marketId}`;
  }
  return `unknown:${item.id}`;
}

/**
 * Convert watchlist items into MarketQuery array
 */
function buildMarketQueries(items: Watchlist['items']): MarketQuery[] {
  const queries: MarketQuery[] = [];

  for (const item of items) {
    if (item.tokenId) {
      queries.push({ kind: 'token', token: item.tokenId });
    } else if (item.marketId) {
      queries.push({ kind: 'market', market: item.marketId });
    }
  }

  return queries;
}

/**
 * Map snapshots back to items using stable keys
 */
function mapSnapshotsToItems(
  items: Watchlist['items'],
  snapshots: Map<string, MarketSnapshot | null>,
): Map<string, MarketSnapshot | null> {
  // Provider already returns Map, just return it directly
  return snapshots;
}

/**
 * Enrich a single watchlist item with market data
 */
function enrichWatchlistItem(
  item: Watchlist['items'][number],
  snapshotMap: Map<string, MarketSnapshot | null>,
): WatchlistItemEnriched {
  const tokens = listTokens();
  const key = buildSnapshotKey(item);
  const snapshot = snapshotMap.get(key) ?? null;

  const signals: SignalResult[] = snapshot
    ? runBuiltinSignalsForSnapshot(snapshot, {})
    : [];

  // Token item
  if (item.tokenId) {
    const token = tokens.find((t) => t.id === item.tokenId);

    if (!token) {
      // Token not found, return minimal data
      return {
        id: item.id,
        kind: 'token',
        createdAt: item.createdAt,
        tokenId: item.tokenId,
        symbol: item.tokenId.toUpperCase(),
        name: 'Unknown Token',
        signals,
      };
    }

    // Try to find a market for additional context
    const market = getMarketById(`${item.tokenId}-usdt`);

    return {
      id: item.id,
      kind: 'token',
      createdAt: item.createdAt,
      tokenId: item.tokenId,
      symbol: token.symbol,
      name: token.name,
      price: snapshot?.price ?? undefined,
      priceChange24h: snapshot?.change24hPct ?? undefined,
      volume24h: snapshot?.volume24h ?? undefined,
      market: market || undefined,
      signals,
    };
  }

  // Market item
  if (item.marketId) {
    const market = getMarketById(item.marketId);

    if (!market) {
      // Market not found, return minimal data
      return {
        id: item.id,
        kind: 'market',
        createdAt: item.createdAt,
        marketId: item.marketId,
        symbol: item.marketId.toUpperCase(),
        name: 'Unknown Market',
        signals,
      };
    }

    return {
      id: item.id,
      kind: 'market',
      createdAt: item.createdAt,
      marketId: item.marketId,
      symbol: `${market.baseToken.symbol}/${market.quoteToken.symbol}`,
      name: `${market.baseToken.name} / ${market.quoteToken.name}`,
      baseSymbol: market.baseToken.symbol,
      quoteSymbol: market.quoteToken.symbol,
      price: snapshot?.price ?? undefined,
      priceChange24h: snapshot?.change24hPct ?? undefined,
      volume24h: snapshot?.volume24h ?? undefined,
      market,
      signals,
    };
  }

  // Edge case: item has neither tokenId nor marketId
  return {
    id: item.id,
    kind: 'token', // default to token
    createdAt: item.createdAt,
    symbol: 'UNKNOWN',
    name: 'Unknown Item',
    signals,
  };
}

/**
 * Enrich a single watchlist with market data
 */
export async function enrichWatchlist(watchlist: Watchlist): Promise<WatchlistEnriched> {
  const provider: MarketDataProvider = getMarketDataProvider();
  const queries = buildMarketQueries(watchlist.items);
  const snapshots = await provider.getSnapshots(queries);
  const snapshotMap = mapSnapshotsToItems(watchlist.items, snapshots);

  return {
    id: watchlist.id,
    ownerUserId: watchlist.ownerUserId,
    name: watchlist.name,
    description: watchlist.description,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    items: watchlist.items.map((item) =>
      enrichWatchlistItem(item, snapshotMap),
    ),
  };
}

/**
 * Enrich multiple watchlists with market data
 */
export async function enrichWatchlists(
  watchlists: Watchlist[],
): Promise<WatchlistEnriched[]> {
  return Promise.all(watchlists.map(enrichWatchlist));
}

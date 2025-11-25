import { listWatchlists, listWatchlistsEnriched } from './service';
import type { WatchlistItemEnriched } from './types';
import {
  getPrimarySignal,
  getSeverityRank,
  type SignalResult,
} from '../signals';

export interface DashboardWatchlistSummary {
  id: string;
  name: string;
  description: string | null;
  ownerUserId: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTopMover {
  id: string;
  watchlistId: string;
  kind: 'token' | 'market';
  symbol: string;
  name: string;
  price: number | undefined;
  priceChange24h: number | undefined;
  volume24h: number | undefined;
  absoluteChange24h: number | undefined;
  tokenId?: string;
  marketId?: string;
}

export interface DashboardTopMoverWithSignals {
  id: string;
  symbol: string;
  name: string;
  price: number | undefined;
  priceChange24h: number | undefined;
  primarySignal: SignalResult | null;
  severityRank: number;
}

export function getWatchlistSummaries(): DashboardWatchlistSummary[] {
  const watchlists = listWatchlists();

  return watchlists.map((watchlist) => ({
    id: watchlist.id,
    name: watchlist.name,
    description: watchlist.description ?? null,
    ownerUserId: watchlist.ownerUserId,
    itemCount: watchlist.items.length,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
  }));
}

export function getTopMovers(limit: number = 5): DashboardTopMover[] {
  const watchlists = listWatchlists();

  const allItems: DashboardTopMover[] = [];

  for (const watchlist of watchlists) {
    for (const item of watchlist.items as WatchlistItemEnriched[]) {
      const absoluteChange24h =
        typeof item.priceChange24h === 'number'
          ? Math.abs(item.priceChange24h)
          : undefined;

      allItems.push({
        id: item.id,
        watchlistId: watchlist.id,
        kind: item.kind,
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        priceChange24h: item.priceChange24h,
        volume24h: item.volume24h,
        absoluteChange24h,
        tokenId: item.tokenId,
        marketId: item.marketId,
      });
    }
  }

  const itemsWithPriceChange = allItems.filter(
    (item) => typeof item.priceChange24h === 'number'
  );

  itemsWithPriceChange.sort((a, b) => {
    const absA = a.absoluteChange24h ?? 0;
    const absB = b.absoluteChange24h ?? 0;
    return absB - absA;
  });

  return itemsWithPriceChange.slice(0, limit);
}

export async function getTopMoversEnriched(limit: number = 5): Promise<DashboardTopMover[]> {
  const watchlists = await listWatchlistsEnriched();

  const allItems: DashboardTopMover[] = [];

  for (const watchlist of watchlists) {
    for (const item of watchlist.items) {
      const absoluteChange24h =
        typeof item.priceChange24h === 'number'
          ? Math.abs(item.priceChange24h)
          : undefined;

      allItems.push({
        id: item.id,
        watchlistId: watchlist.id,
        kind: item.kind,
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        priceChange24h: item.priceChange24h,
        volume24h: item.volume24h,
        absoluteChange24h,
        tokenId: item.tokenId,
        marketId: item.marketId,
      });
    }
  }

  const itemsWithPriceChange = allItems.filter(
    (item) => typeof item.priceChange24h === 'number'
  );

  itemsWithPriceChange.sort((a, b) => {
    const absA = a.absoluteChange24h ?? 0;
    const absB = b.absoluteChange24h ?? 0;
    return absB - absA;
  });

  return itemsWithPriceChange.slice(0, limit);
}

export async function getTopMoversEnrichedWithSignals(
  limit: number = 5
): Promise<DashboardTopMoverWithSignals[]> {
  const watchlists = await listWatchlistsEnriched();

  const allItems: DashboardTopMoverWithSignals[] = [];

  for (const watchlist of watchlists) {
    for (const item of watchlist.items) {
      const primarySignal = getPrimarySignal(item.signals) ?? null;
      const severityRank = primarySignal
        ? getSeverityRank(primarySignal.severity)
        : 0;

      allItems.push({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        priceChange24h: item.priceChange24h,
        primarySignal,
        severityRank,
      });
    }
  }

  // Sort by severityRank desc, then by priceChange24h desc
  allItems.sort((a, b) => {
    if (b.severityRank !== a.severityRank) {
      return b.severityRank - a.severityRank;
    }
    const changeA = a.priceChange24h ?? 0;
    const changeB = b.priceChange24h ?? 0;
    return Math.abs(changeB) - Math.abs(changeA);
  });

  return allItems.slice(0, limit);
}

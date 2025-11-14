import { listTokens, listMarkets } from '../markets';
import { WATCHLISTS } from './data';
import type { Watchlist, WatchlistWithRelations } from './types';

export function listWatchlists(): Watchlist[] {
  return WATCHLISTS;
}

export function getWatchlistById(id: string): Watchlist | undefined {
  return WATCHLISTS.find((wl) => wl.id === id);
}

export function listWatchlistsWithRelations(): WatchlistWithRelations[] {
  const tokens = listTokens();
  const markets = listMarkets();

  return WATCHLISTS.map((watchlist) => ({
    id: watchlist.id,
    name: watchlist.name,
    description: watchlist.description,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    items: watchlist.items.map((item) => {
      const token = item.tokenId
        ? tokens.find((t) => t.id === item.tokenId)
        : undefined;
      const market = item.marketId
        ? markets.find((m) => m.id === item.marketId)
        : undefined;

      return {
        id: item.id,
        createdAt: item.createdAt,
        token,
        market,
      };
    }),
  }));
}

export function getWatchlistWithRelationsById(
  id: string
): WatchlistWithRelations | undefined {
  const watchlist = getWatchlistById(id);

  if (!watchlist) {
    return undefined;
  }

  const tokens = listTokens();
  const markets = listMarkets();

  return {
    id: watchlist.id,
    name: watchlist.name,
    description: watchlist.description,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    items: watchlist.items.map((item) => {
      const token = item.tokenId
        ? tokens.find((t) => t.id === item.tokenId)
        : undefined;
      const market = item.marketId
        ? markets.find((m) => m.id === item.marketId)
        : undefined;

      return {
        id: item.id,
        createdAt: item.createdAt,
        token,
        market,
      };
    }),
  };
}

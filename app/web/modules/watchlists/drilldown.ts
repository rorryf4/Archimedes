import { listWatchlists, listWatchlistsEnriched } from './service';
import type { WatchlistItemEnriched, Watchlist } from './types';

export interface WatchlistReference {
  id: string;
  name: string;
}

export interface AssetDetails extends WatchlistItemEnriched {
  watchlists: WatchlistReference[];
}

/**
 * Get a specific item by its ID from all watchlists (synchronous, no enrichment)
 */
export function getItemById(itemId: string): AssetDetails | undefined {
  const watchlists = listWatchlists();

  for (const watchlist of watchlists) {
    const item = watchlist.items.find((i: Watchlist['items'][number]) => i.id === itemId) as WatchlistItemEnriched | undefined;
    if (item) {
      // Find all watchlists containing this item
      const containingWatchlists = getWatchlistsForItem(itemId);

      return {
        ...item,
        watchlists: containingWatchlists,
      };
    }
  }

  return undefined;
}

/**
 * Get a specific item by its ID with full enrichment (market data + signals)
 */
export async function getItemByIdEnriched(itemId: string): Promise<AssetDetails | undefined> {
  const watchlists = await listWatchlistsEnriched();

  for (const watchlist of watchlists) {
    const item = watchlist.items.find((i) => i.id === itemId);
    if (item) {
      // Find all watchlists containing this item
      const containingWatchlists = getWatchlistsForItem(itemId);

      return {
        ...item,
        watchlists: containingWatchlists,
      };
    }
  }

  return undefined;
}

/**
 * Get all watchlists that contain a specific item
 */
export function getWatchlistsForItem(itemId: string): WatchlistReference[] {
  const watchlists = listWatchlists();
  const result: WatchlistReference[] = [];

  for (const watchlist of watchlists) {
    const hasItem = watchlist.items.some((item: Watchlist['items'][number]) => item.id === itemId);
    if (hasItem) {
      result.push({
        id: watchlist.id,
        name: watchlist.name,
      });
    }
  }

  return result;
}

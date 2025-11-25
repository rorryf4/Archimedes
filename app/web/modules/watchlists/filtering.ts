import type { DashboardWatchlistSummary, DashboardTopMover } from './dashboard';
import type { WatchlistItemEnriched } from './types';

export type KindFilter = 'all' | 'token' | 'market';
export type SortBy = 'name' | 'price' | 'changeAbs' | 'volume';
export type SortDirection = 'asc' | 'desc';
export type TopMoversSortBy = 'changeAbs' | 'price' | 'volume';

export interface FilterAndSortOptions {
  query: string;
  kind: KindFilter;
  sortBy: SortBy;
  direction: SortDirection;
}

export interface TopMoversFilterOptions {
  query: string;
  sortBy: TopMoversSortBy;
}

/**
 * Search watchlists by name or description (case-insensitive)
 */
export function searchWatchlists(
  watchlists: DashboardWatchlistSummary[],
  query: string
): DashboardWatchlistSummary[] {
  const trimmed = query.trim();

  if (trimmed === '') {
    return watchlists;
  }

  const lowerQuery = trimmed.toLowerCase();

  return watchlists.filter((watchlist) => {
    const nameMatch = watchlist.name.toLowerCase().includes(lowerQuery);
    const descMatch = watchlist.description?.toLowerCase().includes(lowerQuery) ?? false;
    return nameMatch || descMatch;
  });
}

/**
 * Filter and sort watchlist items
 */
export function filterAndSortItems(
  items: WatchlistItemEnriched[],
  options: FilterAndSortOptions
): WatchlistItemEnriched[] {
  let result = [...items];

  // Apply kind filter
  if (options.kind !== 'all') {
    result = result.filter((item) => item.kind === options.kind);
  }

  // Apply text search (symbol and name)
  const trimmedQuery = options.query.trim();
  if (trimmedQuery !== '') {
    const lowerQuery = trimmedQuery.toLowerCase();
    result = result.filter((item) => {
      const symbolMatch = item.symbol.toLowerCase().includes(lowerQuery);
      const nameMatch = item.name.toLowerCase().includes(lowerQuery);
      return symbolMatch || nameMatch;
    });
  }

  // Sort
  result.sort((a, b) => {
    let compareResult = 0;

    switch (options.sortBy) {
      case 'name':
        compareResult = a.name.localeCompare(b.name);
        break;

      case 'price': {
        const priceA = a.price;
        const priceB = b.price;

        // Items without price always go last (regardless of direction)
        if (priceA === undefined && priceB === undefined) {
          return 0;
        } else if (priceA === undefined) {
          return 1;
        } else if (priceB === undefined) {
          return -1;
        } else {
          compareResult = priceA - priceB;
        }
        break;
      }

      case 'changeAbs': {
        const changeA = a.priceChange24h;
        const changeB = b.priceChange24h;

        // Items without change always go last (regardless of direction)
        if (changeA === undefined && changeB === undefined) {
          return 0;
        } else if (changeA === undefined) {
          return 1;
        } else if (changeB === undefined) {
          return -1;
        } else {
          compareResult = Math.abs(changeA) - Math.abs(changeB);
        }
        break;
      }

      case 'volume': {
        const volumeA = a.volume24h;
        const volumeB = b.volume24h;

        // Items without volume always go last (regardless of direction)
        if (volumeA === undefined && volumeB === undefined) {
          return 0;
        } else if (volumeA === undefined) {
          return 1;
        } else if (volumeB === undefined) {
          return -1;
        } else {
          compareResult = volumeA - volumeB;
        }
        break;
      }
    }

    // Apply direction
    return options.direction === 'asc' ? compareResult : -compareResult;
  });

  return result;
}

/**
 * Filter and sort top movers
 */
export function filterAndSortTopMovers(
  movers: DashboardTopMover[],
  options: TopMoversFilterOptions
): DashboardTopMover[] {
  let result = [...movers];

  // Apply text search (symbol and name)
  const trimmedQuery = options.query.trim();
  if (trimmedQuery !== '') {
    const lowerQuery = trimmedQuery.toLowerCase();
    result = result.filter((mover) => {
      const symbolMatch = mover.symbol.toLowerCase().includes(lowerQuery);
      const nameMatch = mover.name.toLowerCase().includes(lowerQuery);
      return symbolMatch || nameMatch;
    });
  }

  // Sort
  result.sort((a, b) => {
    let compareResult = 0;

    switch (options.sortBy) {
      case 'changeAbs': {
        const absA = a.absoluteChange24h ?? (a.priceChange24h !== undefined ? Math.abs(a.priceChange24h) : undefined);
        const absB = b.absoluteChange24h ?? (b.priceChange24h !== undefined ? Math.abs(b.priceChange24h) : undefined);

        if (absA === undefined && absB === undefined) {
          compareResult = 0;
        } else if (absA === undefined) {
          compareResult = 1;
        } else if (absB === undefined) {
          compareResult = -1;
        } else {
          compareResult = absB - absA; // Descending for change
        }
        break;
      }

      case 'price': {
        const priceA = a.price;
        const priceB = b.price;

        if (priceA === undefined && priceB === undefined) {
          compareResult = 0;
        } else if (priceA === undefined) {
          compareResult = 1;
        } else if (priceB === undefined) {
          compareResult = -1;
        } else {
          compareResult = priceB - priceA; // Descending for price
        }
        break;
      }

      case 'volume': {
        const volumeA = a.volume24h;
        const volumeB = b.volume24h;

        if (volumeA === undefined && volumeB === undefined) {
          compareResult = 0;
        } else if (volumeA === undefined) {
          compareResult = 1;
        } else if (volumeB === undefined) {
          compareResult = -1;
        } else {
          compareResult = volumeB - volumeA; // Descending for volume
        }
        break;
      }
    }

    return compareResult;
  });

  return result;
}

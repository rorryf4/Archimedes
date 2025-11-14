import { WATCHLISTS } from './data';
import type { Watchlist, WatchlistItem } from './types';
import type {
  CreateWatchlistInput,
  UpdateWatchlistInput,
} from './validation';

// In-memory store - mutable reference to the data
let watchlistsStore: Watchlist[] = [...WATCHLISTS];

/**
 * Generate a unique ID for watchlists or items
 */
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get current ISO timestamp
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * List all watchlists (no auth for now)
 */
export async function listWatchlists(): Promise<Watchlist[]> {
  return [...watchlistsStore];
}

/**
 * Get a single watchlist by ID
 */
export async function getWatchlistById(
  id: string
): Promise<Watchlist | null> {
  const watchlist = watchlistsStore.find((wl) => wl.id === id);
  return watchlist ? { ...watchlist } : null;
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  input: CreateWatchlistInput
): Promise<Watchlist> {
  const newWatchlist: Watchlist = {
    id: generateId('wl'),
    name: input.name,
    description: input.description,
    items: [],
    createdAt: now(),
    updatedAt: now(),
  };

  watchlistsStore.push(newWatchlist);

  return { ...newWatchlist };
}

/**
 * Update watchlist metadata (name, description)
 */
export async function updateWatchlist(
  id: string,
  input: UpdateWatchlistInput
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex((wl) => wl.id === id);

  if (index === -1) {
    return null;
  }

  const watchlist = watchlistsStore[index];

  watchlistsStore[index] = {
    ...watchlist,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    updatedAt: now(),
  };

  return { ...watchlistsStore[index] };
}

/**
 * Add a token to watchlist
 */
export async function addTokenToWatchlist(
  id: string,
  tokenId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex((wl) => wl.id === id);

  if (index === -1) {
    return null;
  }

  const watchlist = watchlistsStore[index];

  // Check if token already exists in watchlist
  const exists = watchlist.items.some((item) => item.tokenId === tokenId);

  if (exists) {
    throw new Error('Token already exists in watchlist');
  }

  const newItem: WatchlistItem = {
    id: generateId('wli'),
    tokenId,
    createdAt: now(),
  };

  watchlistsStore[index] = {
    ...watchlist,
    items: [...watchlist.items, newItem],
    updatedAt: now(),
  };

  return { ...watchlistsStore[index] };
}

/**
 * Add a market to watchlist
 */
export async function addMarketToWatchlist(
  id: string,
  marketId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex((wl) => wl.id === id);

  if (index === -1) {
    return null;
  }

  const watchlist = watchlistsStore[index];

  // Check if market already exists in watchlist
  const exists = watchlist.items.some((item) => item.marketId === marketId);

  if (exists) {
    throw new Error('Market already exists in watchlist');
  }

  const newItem: WatchlistItem = {
    id: generateId('wli'),
    marketId,
    createdAt: now(),
  };

  watchlistsStore[index] = {
    ...watchlist,
    items: [...watchlist.items, newItem],
    updatedAt: now(),
  };

  return { ...watchlistsStore[index] };
}

/**
 * Remove an item from watchlist
 */
export async function removeItemFromWatchlist(
  id: string,
  itemId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex((wl) => wl.id === id);

  if (index === -1) {
    return null;
  }

  const watchlist = watchlistsStore[index];

  const itemIndex = watchlist.items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Item not found in watchlist');
  }

  watchlistsStore[index] = {
    ...watchlist,
    items: watchlist.items.filter((item) => item.id !== itemId),
    updatedAt: now(),
  };

  return { ...watchlistsStore[index] };
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(id: string): Promise<void> {
  const index = watchlistsStore.findIndex((wl) => wl.id === id);

  if (index === -1) {
    throw new Error('Watchlist not found');
  }

  watchlistsStore.splice(index, 1);
}

/**
 * Reset store to initial data (useful for testing)
 */
export function resetStore(): void {
  watchlistsStore = [...WATCHLISTS];
}

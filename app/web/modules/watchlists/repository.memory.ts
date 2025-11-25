// app/web/modules/watchlists/repository.memory.ts
// In-memory repository implementation for watchlists (used by tests and when Supabase is disabled)

import { WATCHLISTS } from './data';
import type { Watchlist, WatchlistItem, WatchlistUserContext } from './types';
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
 * List all watchlists for a specific user
 */
export async function listWatchlists(
  context: WatchlistUserContext
): Promise<Watchlist[]> {
  return watchlistsStore
    .filter((wl) => wl.ownerUserId === context.userId)
    .map((wl) => ({ ...wl }));
}

/**
 * Get a single watchlist by ID (user-scoped)
 */
export async function getWatchlistById(
  context: WatchlistUserContext,
  id: string
): Promise<Watchlist | null> {
  const watchlist = watchlistsStore.find(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );
  return watchlist ? { ...watchlist } : null;
}

/**
 * Create a new watchlist for the current user
 */
export async function createWatchlist(
  context: WatchlistUserContext,
  input: CreateWatchlistInput
): Promise<Watchlist> {
  const newWatchlist: Watchlist = {
    id: generateId('wl'),
    ownerUserId: context.userId,
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
 * Update watchlist metadata (name, description) - user-scoped
 */
export async function updateWatchlist(
  context: WatchlistUserContext,
  id: string,
  input: UpdateWatchlistInput
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );

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
 * Add a token to watchlist (user-scoped)
 */
export async function addTokenToWatchlist(
  context: WatchlistUserContext,
  id: string,
  tokenId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );

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
 * Add a market to watchlist (user-scoped)
 */
export async function addMarketToWatchlist(
  context: WatchlistUserContext,
  id: string,
  marketId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );

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
 * Remove an item from watchlist (user-scoped)
 */
export async function removeItemFromWatchlist(
  context: WatchlistUserContext,
  id: string,
  itemId: string
): Promise<Watchlist | null> {
  const index = watchlistsStore.findIndex(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );

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
 * Delete a watchlist (user-scoped)
 */
export async function deleteWatchlist(
  context: WatchlistUserContext,
  id: string
): Promise<void> {
  const index = watchlistsStore.findIndex(
    (wl) => wl.id === id && wl.ownerUserId === context.userId
  );

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

// app/web/modules/watchlists/repository.ts
// Repository switcher: delegates to memory or Supabase implementation based on env flag

import type { Watchlist, WatchlistUserContext } from './types';
import type {
  CreateWatchlistInput,
  UpdateWatchlistInput,
} from './validation';
import * as memoryRepo from './repository.memory';
import * as supabaseRepo from './repository.supabase';

// Determine which repository to use
const USE_SUPABASE_PERSISTENCE =
  process.env.USE_SUPABASE_PERSISTENCE === 'true';

// Select the appropriate repository implementation
const repository = USE_SUPABASE_PERSISTENCE ? supabaseRepo : memoryRepo;

/**
 * List all watchlists for a specific user
 */
export async function listWatchlists(
  context: WatchlistUserContext
): Promise<Watchlist[]> {
  return repository.listWatchlists(context);
}

/**
 * Get a single watchlist by ID (user-scoped)
 */
export async function getWatchlistById(
  context: WatchlistUserContext,
  id: string
): Promise<Watchlist | null> {
  return repository.getWatchlistById(context, id);
}

/**
 * Create a new watchlist for the current user
 */
export async function createWatchlist(
  context: WatchlistUserContext,
  input: CreateWatchlistInput
): Promise<Watchlist> {
  return repository.createWatchlist(context, input);
}

/**
 * Update watchlist metadata (name, description) - user-scoped
 */
export async function updateWatchlist(
  context: WatchlistUserContext,
  id: string,
  input: UpdateWatchlistInput
): Promise<Watchlist | null> {
  return repository.updateWatchlist(context, id, input);
}

/**
 * Add a token to watchlist (user-scoped)
 */
export async function addTokenToWatchlist(
  context: WatchlistUserContext,
  id: string,
  tokenId: string
): Promise<Watchlist | null> {
  return repository.addTokenToWatchlist(context, id, tokenId);
}

/**
 * Add a market to watchlist (user-scoped)
 */
export async function addMarketToWatchlist(
  context: WatchlistUserContext,
  id: string,
  marketId: string
): Promise<Watchlist | null> {
  return repository.addMarketToWatchlist(context, id, marketId);
}

/**
 * Remove an item from watchlist (user-scoped)
 */
export async function removeItemFromWatchlist(
  context: WatchlistUserContext,
  id: string,
  itemId: string
): Promise<Watchlist | null> {
  return repository.removeItemFromWatchlist(context, id, itemId);
}

/**
 * Delete a watchlist (user-scoped)
 */
export async function deleteWatchlist(
  context: WatchlistUserContext,
  id: string
): Promise<void> {
  return repository.deleteWatchlist(context, id);
}

/**
 * Reset store to initial data (useful for testing)
 * Note: Only works with memory repository
 */
export function resetStore(): void {
  return repository.resetStore();
}

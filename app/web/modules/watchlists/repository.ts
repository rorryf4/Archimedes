// app/web/modules/watchlists/repository.ts
// Repository switcher: delegates to memory or Supabase implementation based on env flag

import type { Watchlist } from './types';
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

if (USE_SUPABASE_PERSISTENCE) {
  console.log('[Repository] Using Supabase persistence');
} else {
  console.log('[Repository] Using in-memory persistence');
}

/**
 * List all watchlists (no auth for now)
 */
export async function listWatchlists(): Promise<Watchlist[]> {
  return repository.listWatchlists();
}

/**
 * Get a single watchlist by ID
 */
export async function getWatchlistById(
  id: string
): Promise<Watchlist | null> {
  return repository.getWatchlistById(id);
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  input: CreateWatchlistInput
): Promise<Watchlist> {
  return repository.createWatchlist(input);
}

/**
 * Update watchlist metadata (name, description)
 */
export async function updateWatchlist(
  id: string,
  input: UpdateWatchlistInput
): Promise<Watchlist | null> {
  return repository.updateWatchlist(id, input);
}

/**
 * Add a token to watchlist
 */
export async function addTokenToWatchlist(
  id: string,
  tokenId: string
): Promise<Watchlist | null> {
  return repository.addTokenToWatchlist(id, tokenId);
}

/**
 * Add a market to watchlist
 */
export async function addMarketToWatchlist(
  id: string,
  marketId: string
): Promise<Watchlist | null> {
  return repository.addMarketToWatchlist(id, marketId);
}

/**
 * Remove an item from watchlist
 */
export async function removeItemFromWatchlist(
  id: string,
  itemId: string
): Promise<Watchlist | null> {
  return repository.removeItemFromWatchlist(id, itemId);
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(id: string): Promise<void> {
  return repository.deleteWatchlist(id);
}

/**
 * Reset store to initial data (useful for testing)
 * Note: Only works with memory repository
 */
export function resetStore(): void {
  return repository.resetStore();
}

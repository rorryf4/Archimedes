// app/web/modules/watchlists/repository.supabase.ts
// Supabase repository implementation for watchlists

import { createClient } from '@supabase/supabase-js';
import type { Watchlist, WatchlistItem } from './types';
import type {
  CreateWatchlistInput,
  UpdateWatchlistInput,
} from './validation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Repository] Missing environment variables. Supabase features will not work.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database row types
interface WatchlistRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WatchlistItemRow {
  id: string;
  watchlist_id: string;
  kind: 'token' | 'market';
  token_id: string | null;
  market_id: string | null;
  created_at: string;
}

/**
 * Convert database row to Watchlist domain object
 */
function mapWatchlistRow(
  row: WatchlistRow,
  items: WatchlistItemRow[]
): Watchlist {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map(mapWatchlistItemRow),
  };
}

/**
 * Convert database row to WatchlistItem domain object
 */
function mapWatchlistItemRow(row: WatchlistItemRow): WatchlistItem {
  const base: WatchlistItem = {
    id: row.id,
    createdAt: row.created_at,
  };

  if (row.kind === 'token' && row.token_id) {
    return { ...base, tokenId: row.token_id };
  } else if (row.kind === 'market' && row.market_id) {
    return { ...base, marketId: row.market_id };
  }

  // Fallback (should not happen due to DB constraints)
  throw new Error(`Invalid watchlist item: ${row.id}`);
}

/**
 * List all watchlists (no auth for now)
 */
export async function listWatchlists(): Promise<Watchlist[]> {
  const { data: watchlistRows, error: watchlistError } = await supabase
    .from('watchlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (watchlistError) {
    throw new Error(`Failed to list watchlists: ${watchlistError.message}`);
  }

  if (!watchlistRows || watchlistRows.length === 0) {
    return [];
  }

  // Fetch all items for all watchlists in one query
  const watchlistIds = watchlistRows.map((row) => row.id);
  const { data: itemRows, error: itemsError } = await supabase
    .from('watchlist_items')
    .select('*')
    .in('watchlist_id', watchlistIds)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(`Failed to fetch watchlist items: ${itemsError.message}`);
  }

  // Group items by watchlist_id
  const itemsByWatchlistId = new Map<string, WatchlistItemRow[]>();
  (itemRows || []).forEach((item) => {
    const existing = itemsByWatchlistId.get(item.watchlist_id) || [];
    existing.push(item);
    itemsByWatchlistId.set(item.watchlist_id, existing);
  });

  return watchlistRows.map((row) =>
    mapWatchlistRow(row, itemsByWatchlistId.get(row.id) || [])
  );
}

/**
 * Get a single watchlist by ID
 */
export async function getWatchlistById(
  id: string
): Promise<Watchlist | null> {
  const { data: watchlistRow, error: watchlistError } = await supabase
    .from('watchlists')
    .select('*')
    .eq('id', id)
    .single();

  if (watchlistError) {
    if (watchlistError.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(
      `Failed to get watchlist ${id}: ${watchlistError.message}`
    );
  }

  if (!watchlistRow) {
    return null;
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('watchlist_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(
      `Failed to fetch items for watchlist ${id}: ${itemsError.message}`
    );
  }

  return mapWatchlistRow(watchlistRow, itemRows || []);
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  input: CreateWatchlistInput
): Promise<Watchlist> {
  const { data: watchlistRow, error } = await supabase
    .from('watchlists')
    .insert({
      name: input.name,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create watchlist: ${error.message}`);
  }

  if (!watchlistRow) {
    throw new Error('Failed to create watchlist: No data returned');
  }

  return mapWatchlistRow(watchlistRow, []);
}

/**
 * Update watchlist metadata (name, description)
 */
export async function updateWatchlist(
  id: string,
  input: UpdateWatchlistInput
): Promise<Watchlist | null> {
  const updateData: Partial<WatchlistRow> = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description ?? null;
  }

  const { data: watchlistRow, error } = await supabase
    .from('watchlists')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to update watchlist ${id}: ${error.message}`);
  }

  if (!watchlistRow) {
    return null;
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('watchlist_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(
      `Failed to fetch items for watchlist ${id}: ${itemsError.message}`
    );
  }

  return mapWatchlistRow(watchlistRow, itemRows || []);
}

/**
 * Add a token to watchlist
 */
export async function addTokenToWatchlist(
  id: string,
  tokenId: string
): Promise<Watchlist | null> {
  // Check if watchlist exists
  const watchlist = await getWatchlistById(id);
  if (!watchlist) {
    return null;
  }

  // Check if token already exists in watchlist
  const exists = watchlist.items.some((item) => item.tokenId === tokenId);
  if (exists) {
    throw new Error('Token already exists in watchlist');
  }

  // Add the token item
  const { error } = await supabase.from('watchlist_items').insert({
    watchlist_id: id,
    kind: 'token',
    token_id: tokenId,
    market_id: null,
  });

  if (error) {
    throw new Error(
      `Failed to add token to watchlist ${id}: ${error.message}`
    );
  }

  // Return updated watchlist
  return getWatchlistById(id);
}

/**
 * Add a market to watchlist
 */
export async function addMarketToWatchlist(
  id: string,
  marketId: string
): Promise<Watchlist | null> {
  // Check if watchlist exists
  const watchlist = await getWatchlistById(id);
  if (!watchlist) {
    return null;
  }

  // Check if market already exists in watchlist
  const exists = watchlist.items.some((item) => item.marketId === marketId);
  if (exists) {
    throw new Error('Market already exists in watchlist');
  }

  // Add the market item
  const { error } = await supabase.from('watchlist_items').insert({
    watchlist_id: id,
    kind: 'market',
    token_id: null,
    market_id: marketId,
  });

  if (error) {
    throw new Error(
      `Failed to add market to watchlist ${id}: ${error.message}`
    );
  }

  // Return updated watchlist
  return getWatchlistById(id);
}

/**
 * Remove an item from watchlist
 */
export async function removeItemFromWatchlist(
  id: string,
  itemId: string
): Promise<Watchlist | null> {
  // Check if watchlist exists
  const watchlist = await getWatchlistById(id);
  if (!watchlist) {
    return null;
  }

  // Check if item exists in this watchlist
  const itemExists = watchlist.items.some((item) => item.id === itemId);
  if (!itemExists) {
    throw new Error('Item not found in watchlist');
  }

  // Delete the item
  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('id', itemId)
    .eq('watchlist_id', id);

  if (error) {
    throw new Error(
      `Failed to remove item from watchlist ${id}: ${error.message}`
    );
  }

  // Return updated watchlist
  return getWatchlistById(id);
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(id: string): Promise<void> {
  const { error } = await supabase.from('watchlists').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete watchlist ${id}: ${error.message}`);
  }

  // Note: Items are automatically deleted due to ON DELETE CASCADE
}

/**
 * Reset store - not applicable for Supabase
 * This function exists for API compatibility with memory repository
 */
export function resetStore(): void {
  console.warn(
    '[Supabase Repository] resetStore() called but has no effect on Supabase backend'
  );
}

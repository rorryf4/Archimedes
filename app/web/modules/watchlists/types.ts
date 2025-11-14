import type { Token, Market } from '../markets';

export interface WatchlistItem {
  id: string;
  tokenId?: string;
  marketId?: string;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistWithRelations {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    createdAt: string;
    token?: Token;
    market?: Market & {
      baseToken: Token;
      quoteToken: Token;
    };
  }>;
}

// Enriched types with market data for UI display
export interface WatchlistItemEnriched {
  id: string;
  kind: 'token' | 'market';
  createdAt: string;

  // IDs for reference
  tokenId?: string;
  marketId?: string;

  // Display metadata
  symbol: string;
  name: string;

  // Market data (optional, may not be available for all items)
  price?: number;
  priceChange24h?: number;
  volume24h?: number;

  // For markets, include pair information
  baseSymbol?: string;
  quoteSymbol?: string;
}

export interface WatchlistEnriched {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItemEnriched[];
}

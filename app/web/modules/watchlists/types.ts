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

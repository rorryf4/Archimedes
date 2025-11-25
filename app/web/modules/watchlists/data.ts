import type { Watchlist, WatchlistUserContext } from './types';

// Default test user ID for development and testing
export const DEFAULT_TEST_USER_ID = 'user-test-default';

/**
 * Get the current user context for watchlist operations.
 * In a real app, this would extract the user ID from the session/JWT.
 * For now, we use a hardcoded test user ID.
 */
export function getCurrentUserContext(): WatchlistUserContext {
  // TODO: Replace with real authentication when available
  return { userId: DEFAULT_TEST_USER_ID };
}

export const WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-favorites',
    ownerUserId: DEFAULT_TEST_USER_ID,
    name: 'My Favorites',
    description: 'My favorite cryptocurrencies and markets',
    items: [
      {
        id: 'wli-1',
        tokenId: 'btc',
        createdAt: '2025-01-10T10:00:00Z',
      },
      {
        id: 'wli-2',
        marketId: 'btc-usdt',
        createdAt: '2025-01-10T10:05:00Z',
      },
      {
        id: 'wli-3',
        tokenId: 'eth',
        createdAt: '2025-01-10T10:10:00Z',
      },
    ],
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-10T10:10:00Z',
  },
  {
    id: 'wl-trending',
    ownerUserId: DEFAULT_TEST_USER_ID,
    name: 'Trending Markets',
    description: 'Currently trending cryptocurrency markets',
    items: [
      {
        id: 'wli-4',
        marketId: 'eth-usdt',
        createdAt: '2025-01-11T09:00:00Z',
      },
      {
        id: 'wli-5',
        tokenId: 'usdt',
        createdAt: '2025-01-11T09:30:00Z',
      },
    ],
    createdAt: '2025-01-11T08:00:00Z',
    updatedAt: '2025-01-11T09:30:00Z',
  },
];

import type { Watchlist } from './types';

export const WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-favorites',
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

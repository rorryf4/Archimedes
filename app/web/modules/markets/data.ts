// app/web/modules/markets/data.ts
import type { Token, Market, PriceFeed } from './types';

export const TOKENS: readonly Token[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
] as const;

export const MARKETS: readonly Market[] = [
  {
    id: 'btc-usdt',
    baseTokenId: 'btc',
    quoteTokenId: 'usdt',
    venue: 'SIMULATED',
    status: 'ACTIVE',
  },
  {
    id: 'eth-usdt',
    baseTokenId: 'eth',
    quoteTokenId: 'usdt',
    venue: 'SIMULATED',
    status: 'ACTIVE',
  },
] as const;

const MOCK_PRICES: Record<string, number> = {
  'btc-usdt': 43250.5,
  'eth-usdt': 2285.75,
};

export function getMockPriceFeed(marketId: string): PriceFeed {
  return {
    marketId,
    price: MOCK_PRICES[marketId] ?? 0,
    timestamp: new Date().toISOString(),
  };
}

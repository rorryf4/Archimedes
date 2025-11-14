// app/web/modules/markets/service.ts
import type { Token, Market, PriceFeed } from './types';
import { TOKENS, MARKETS, getMockPriceFeed } from './data';

export type MarketWithTokens = Market & {
  baseToken: Token;
  quoteToken: Token;
};

export function listTokens(): Token[] {
  return [...TOKENS];
}

export function listMarkets(): MarketWithTokens[] {
  return MARKETS.map((market) => {
    const baseToken = TOKENS.find((t) => t.id === market.baseTokenId);
    const quoteToken = TOKENS.find((t) => t.id === market.quoteTokenId);

    if (!baseToken || !quoteToken) {
      throw new Error(`Invalid market configuration: ${market.id}`);
    }

    return {
      ...market,
      baseToken,
      quoteToken,
    };
  });
}

export function getMarketById(id: string): MarketWithTokens | undefined {
  const market = MARKETS.find((m) => m.id === id);
  if (!market) {
    return undefined;
  }

  const baseToken = TOKENS.find((t) => t.id === market.baseTokenId);
  const quoteToken = TOKENS.find((t) => t.id === market.quoteTokenId);

  if (!baseToken || !quoteToken) {
    throw new Error(`Invalid market configuration: ${market.id}`);
  }

  return {
    ...market,
    baseToken,
    quoteToken,
  };
}

export function getLatestPriceFeedForMarket(id: string): PriceFeed | undefined {
  const market = getMarketById(id);
  if (!market) {
    return undefined;
  }

  return getMockPriceFeed(id);
}

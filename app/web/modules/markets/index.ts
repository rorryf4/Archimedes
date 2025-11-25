// app/web/modules/markets/index.ts

export type { Token, Market, PriceFeed } from './types';
export {
  listTokens,
  listMarkets,
  getMarketById,
  getLatestPriceFeedForMarket,
} from './service';
export type { MarketSnapshot, MarketQuery, MarketDataProvider } from './marketData';
export { getMarketDataProvider } from './marketData';

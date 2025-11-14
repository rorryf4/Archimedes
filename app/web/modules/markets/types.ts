// app/web/modules/markets/types.ts

export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface Market {
  id: string;
  baseTokenId: string;
  quoteTokenId: string;
  venue: 'BINANCE' | 'COINBASE' | 'KRAKEN' | 'SIMULATED';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PriceFeed {
  marketId: string;
  price: number;
  timestamp: string;
}

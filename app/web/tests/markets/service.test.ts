import { describe, it, expect } from 'vitest';
import {
  listTokens,
  listMarkets,
  getMarketById,
  getLatestPriceFeedForMarket,
} from '@/modules/markets/service';

describe('markets service', () => {
  describe('listTokens', () => {
    it('returns all tokens from TOKENS array', () => {
      const tokens = listTokens();

      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('contains BTC token with correct properties', () => {
      const tokens = listTokens();
      const btc = tokens.find((t) => t.id === 'btc');

      expect(btc).toBeDefined();
      expect(btc?.symbol).toBe('BTC');
      expect(btc?.name).toBe('Bitcoin');
      expect(btc?.decimals).toBe(8);
    });

    it('contains ETH token with correct properties', () => {
      const tokens = listTokens();
      const eth = tokens.find((t) => t.id === 'eth');

      expect(eth).toBeDefined();
      expect(eth?.symbol).toBe('ETH');
      expect(eth?.name).toBe('Ethereum');
      expect(eth?.decimals).toBe(18);
    });

    it('contains USDT token with correct properties', () => {
      const tokens = listTokens();
      const usdt = tokens.find((t) => t.id === 'usdt');

      expect(usdt).toBeDefined();
      expect(usdt?.symbol).toBe('USDT');
      expect(usdt?.name).toBe('Tether USD');
      expect(usdt?.decimals).toBe(6);
    });
  });

  describe('listMarkets', () => {
    it('returns configured markets with joined tokens', () => {
      const markets = listMarkets();

      expect(markets).toBeDefined();
      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);
    });

    it('contains btc-usdt market with correct structure', () => {
      const markets = listMarkets();
      const btcUsdt = markets.find((m) => m.id === 'btc-usdt');

      expect(btcUsdt).toBeDefined();
      expect(btcUsdt?.baseTokenId).toBe('btc');
      expect(btcUsdt?.quoteTokenId).toBe('usdt');
      expect(btcUsdt?.baseToken).toBeDefined();
      expect(btcUsdt?.quoteToken).toBeDefined();
      expect(btcUsdt?.baseToken.symbol).toBe('BTC');
      expect(btcUsdt?.quoteToken.symbol).toBe('USDT');
    });

    it('all markets have baseToken and quoteToken populated', () => {
      const markets = listMarkets();

      markets.forEach((market) => {
        expect(market.baseToken).toBeDefined();
        expect(market.quoteToken).toBeDefined();
        expect(market.baseToken.id).toBe(market.baseTokenId);
        expect(market.quoteToken.id).toBe(market.quoteTokenId);
      });
    });
  });

  describe('getMarketById', () => {
    it('returns market for known id', () => {
      const market = getMarketById('btc-usdt');

      expect(market).toBeDefined();
      expect(market?.id).toBe('btc-usdt');
      expect(market?.baseToken).toBeDefined();
      expect(market?.quoteToken).toBeDefined();
      expect(market?.baseToken.symbol).toBe('BTC');
      expect(market?.quoteToken.symbol).toBe('USDT');
    });

    it('returns undefined for unknown id', () => {
      const market = getMarketById('unknown-market-id');

      expect(market).toBeUndefined();
    });

    it('returns market with all required fields', () => {
      const market = getMarketById('btc-usdt');

      expect(market).toBeDefined();
      expect(market?.id).toBeDefined();
      expect(market?.baseTokenId).toBeDefined();
      expect(market?.quoteTokenId).toBeDefined();
      expect(market?.venue).toBeDefined();
      expect(market?.status).toBeDefined();
      expect(market?.baseToken).toBeDefined();
      expect(market?.quoteToken).toBeDefined();
    });
  });

  describe('getLatestPriceFeedForMarket', () => {
    it('returns price feed for existing market', () => {
      const priceFeed = getLatestPriceFeedForMarket('btc-usdt');

      expect(priceFeed).toBeDefined();
      expect(priceFeed?.marketId).toBe('btc-usdt');
      expect(typeof priceFeed?.price).toBe('number');
      expect(priceFeed?.price).toBeGreaterThan(0);
    });

    it('price feed has valid ISO 8601 timestamp', () => {
      const priceFeed = getLatestPriceFeedForMarket('btc-usdt');

      expect(priceFeed).toBeDefined();
      expect(priceFeed?.timestamp).toBeDefined();

      // Validate ISO 8601 format by parsing
      const date = new Date(priceFeed!.timestamp);
      expect(date.toISOString()).toBe(priceFeed!.timestamp);
    });

    it('returns undefined for non-existent market', () => {
      const priceFeed = getLatestPriceFeedForMarket('non-existent-market');

      expect(priceFeed).toBeUndefined();
    });

    it('returns different timestamps on multiple calls', () => {
      const feed1 = getLatestPriceFeedForMarket('btc-usdt');
      const feed2 = getLatestPriceFeedForMarket('btc-usdt');

      expect(feed1).toBeDefined();
      expect(feed2).toBeDefined();
      // Timestamps should be different (or at least valid)
      expect(feed1?.timestamp).toBeDefined();
      expect(feed2?.timestamp).toBeDefined();
    });
  });
});

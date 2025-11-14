// app/web/modules/watchlists/enrichment.ts
import { listTokens, getMarketById, getLatestPriceFeedForMarket } from '../markets';
import type { Watchlist, WatchlistEnriched, WatchlistItemEnriched } from './types';

/**
 * Simple in-memory cache for price data to avoid repeated lookups
 * TTL: 60 seconds
 */
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const priceCache = new Map<string, CacheEntry<number>>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCachedPrice(marketId: string): number | undefined {
  const entry = priceCache.get(marketId);
  if (!entry) return undefined;

  const now = Date.now();
  if (now - entry.fetchedAt > CACHE_TTL_MS) {
    priceCache.delete(marketId);
    return undefined;
  }

  return entry.data;
}

function setCachedPrice(marketId: string, price: number): void {
  priceCache.set(marketId, {
    data: price,
    fetchedAt: Date.now(),
  });
}

/**
 * Get price for a market with caching
 */
function getMarketPrice(marketId: string): number | undefined {
  // Check cache first
  const cached = getCachedPrice(marketId);
  if (cached !== undefined) {
    return cached;
  }

  // Fetch fresh price
  const priceFeed = getLatestPriceFeedForMarket(marketId);
  if (priceFeed) {
    setCachedPrice(marketId, priceFeed.price);
    return priceFeed.price;
  }

  return undefined;
}

/**
 * Generate mock 24h price change percentage for demonstration
 * In production, this would come from a real price history service
 */
function getMockPriceChange24h(marketId: string): number {
  // Use marketId to generate a stable but varied mock value between -10% and +10%
  const hash = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((hash % 2000) - 1000) / 100; // Range: -10.00 to +10.00
}

/**
 * Generate mock 24h volume for demonstration
 * In production, this would come from a real volume tracking service
 */
function getMockVolume24h(marketId: string): number {
  // Use marketId to generate a stable but varied mock volume
  const hash = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 10000000) + 1000000; // Range: 1M to 11M
}

/**
 * Enrich a single watchlist item with market data
 */
function enrichWatchlistItem(
  item: Watchlist['items'][number]
): WatchlistItemEnriched {
  const tokens = listTokens();

  // Token item
  if (item.tokenId) {
    const token = tokens.find((t) => t.id === item.tokenId);

    if (!token) {
      // Token not found, return minimal data
      return {
        id: item.id,
        kind: 'token',
        createdAt: item.createdAt,
        tokenId: item.tokenId,
        symbol: item.tokenId.toUpperCase(),
        name: 'Unknown Token',
      };
    }

    // For tokens, we can try to find a market to get price data
    // Look for any market where this token is the base token
    const market = getMarketById(`${item.tokenId}-usdt`);
    const price = market ? getMarketPrice(market.id) : undefined;
    const priceChange24h = market ? getMockPriceChange24h(market.id) : undefined;
    const volume24h = market ? getMockVolume24h(market.id) : undefined;

    return {
      id: item.id,
      kind: 'token',
      createdAt: item.createdAt,
      tokenId: item.tokenId,
      symbol: token.symbol,
      name: token.name,
      price,
      priceChange24h,
      volume24h,
    };
  }

  // Market item
  if (item.marketId) {
    const market = getMarketById(item.marketId);

    if (!market) {
      // Market not found, return minimal data
      return {
        id: item.id,
        kind: 'market',
        createdAt: item.createdAt,
        marketId: item.marketId,
        symbol: item.marketId.toUpperCase(),
        name: 'Unknown Market',
      };
    }

    const price = getMarketPrice(market.id);
    const priceChange24h = getMockPriceChange24h(market.id);
    const volume24h = getMockVolume24h(market.id);

    return {
      id: item.id,
      kind: 'market',
      createdAt: item.createdAt,
      marketId: item.marketId,
      symbol: `${market.baseToken.symbol}/${market.quoteToken.symbol}`,
      name: `${market.baseToken.name} / ${market.quoteToken.name}`,
      baseSymbol: market.baseToken.symbol,
      quoteSymbol: market.quoteToken.symbol,
      price,
      priceChange24h,
      volume24h,
    };
  }

  // Edge case: item has neither tokenId nor marketId
  return {
    id: item.id,
    kind: 'token', // default to token
    createdAt: item.createdAt,
    symbol: 'UNKNOWN',
    name: 'Unknown Item',
  };
}

/**
 * Enrich a single watchlist with market data
 */
export function enrichWatchlist(watchlist: Watchlist): WatchlistEnriched {
  return {
    id: watchlist.id,
    name: watchlist.name,
    description: watchlist.description,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    items: watchlist.items.map(enrichWatchlistItem),
  };
}

/**
 * Enrich multiple watchlists with market data
 */
export function enrichWatchlists(watchlists: Watchlist[]): WatchlistEnriched[] {
  return watchlists.map(enrichWatchlist);
}

/**
 * Clear the price cache (useful for testing)
 */
export function clearPriceCache(): void {
  priceCache.clear();
}

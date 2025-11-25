import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listOpportunities } from '@/modules/opportunities/service';
import * as watchlistService from '@/modules/watchlists/service';
import * as signalPreferences from '@/modules/signals/preferences.service';
import * as marketHistory from '@/modules/markets/history';
import * as marketCandles from '@/modules/markets/candles';
import * as structureModule from '@/modules/opportunities/structure';
import type { WatchlistItemEnriched } from '@/modules/watchlists/types';
import type { SignalResult } from '@/modules/signals/types';
import type { CandlePoint } from '@/modules/markets/candles';

// Mock all dependencies
vi.mock('@/modules/watchlists/service');
vi.mock('@/modules/signals/preferences.service');
vi.mock('@/modules/markets/history');
vi.mock('@/modules/markets/candles');
vi.mock('@/modules/opportunities/structure');

describe('listOpportunities - structure filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(signalPreferences.getCurrentUserSignalPreferences).mockResolvedValue(null);
    vi.mocked(marketHistory.getPriceHistoryForAsset).mockResolvedValue([]);
    vi.mocked(marketCandles.getCandlestickData).mockResolvedValue([]);
    vi.mocked(structureModule.detectStructureSignals).mockReturnValue([]);
  });

  describe('structure filter application', () => {
    it('should filter opportunities by trendline break', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
            {
              id: 'asset2',
              symbol: 'ETH',
              name: 'Ethereum',
              kind: 'token' as const,
              signals: [{ id: 'volume_burst', label: 'Volume Burst', value: 3, unit: 'x', severity: 'info' as const, timestamp: new Date().toISOString() }],
              price: 3000,
              priceChange24h: 3,
              volume24h: 500000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);

      // Mock structure signal detection - only asset1 gets trendline break
      vi.mocked(structureModule.detectStructureSignals).mockImplementation(() => []);
      vi.mocked(marketCandles.getCandlestickData).mockImplementation(async (assetId: string) => {
        const mockCandles: CandlePoint[] = Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }));
        return mockCandles;
      });

      vi.mocked(structureModule.detectStructureSignals).mockImplementation(() => {
        return [
          {
            id: 'trendline_break_up',
            label: 'Trendline Break (Up)',
            value: null,
            unit: null,
            severity: 'watch',
            timestamp: new Date().toISOString(),
          },
        ];
      });

      // Apply filter for trendline breaks
      const opportunities = await listOpportunities({
        structureFilters: {
          trendlineBreak: true,
        },
      });

      // Both assets should have trendline break signal due to mock
      expect(opportunities.length).toBe(2);
      opportunities.forEach((opp) => {
        const hasTrendlineBreak = opp.signals.some(
          (s) => s.id === 'trendline_break_up' || s.id === 'trendline_break_down'
        );
        expect(hasTrendlineBreak).toBe(true);
      });
    });

    it('should filter opportunities by break & retest', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'trendline_break_retest',
          label: 'Trendline Break & Retest',
          value: null,
          unit: null,
          severity: 'action',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          breakRetest: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasBreakRetest = opportunities[0].signals.some((s) => s.id === 'trendline_break_retest');
      expect(hasBreakRetest).toBe(true);
    });

    it('should filter opportunities by S/R break', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'support_break',
          label: 'Support Break',
          value: 100,
          unit: null,
          severity: 'watch',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          srBreak: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasSRBreak = opportunities[0].signals.some(
        (s) => s.id === 'support_break' || s.id === 'resistance_break'
      );
      expect(hasSRBreak).toBe(true);
    });

    it('should filter opportunities by S/R flip', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'resistance_flip',
          label: 'Resistance Flip',
          value: 150,
          unit: null,
          severity: 'action',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          srFlip: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasSRFlip = opportunities[0].signals.some(
        (s) => s.id === 'support_flip' || s.id === 'resistance_flip'
      );
      expect(hasSRFlip).toBe(true);
    });

    it('should filter opportunities by liquidity sweep', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'liquidity_sweep_up',
          label: 'Liquidity Sweep (Up)',
          value: 95,
          unit: null,
          severity: 'action',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          liquiditySweep: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasSweep = opportunities[0].signals.some(
        (s) => s.id === 'liquidity_sweep_up' || s.id === 'liquidity_sweep_down'
      );
      expect(hasSweep).toBe(true);
    });

    it('should filter opportunities by FVG', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'fvg_bullish',
          label: 'Bullish Fair Value Gap',
          value: 105,
          unit: null,
          severity: 'info',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          fvg: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasFVG = opportunities[0].signals.some(
        (s) => s.id === 'fvg_bullish' || s.id === 'fvg_bearish'
      );
      expect(hasFVG).toBe(true);
    });

    it('should filter opportunities by Fib discount zone', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'discount_retrace',
          label: 'Fibonacci Discount Zone',
          value: 130,
          unit: null,
          severity: 'info',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          fibDiscount: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasDiscount = opportunities[0].signals.some((s) => s.id === 'discount_retrace');
      expect(hasDiscount).toBe(true);
    });

    it('should filter opportunities by Fib premium zone', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'premium_retrace',
          label: 'Fibonacci Premium Zone',
          value: 170,
          unit: null,
          severity: 'info',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          fibPremium: true,
        },
      });

      expect(opportunities.length).toBe(1);
      const hasPremium = opportunities[0].signals.some((s) => s.id === 'premium_retrace');
      expect(hasPremium).toBe(true);
    });

    it('should apply multiple structure filters with AND logic', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
            {
              id: 'asset2',
              symbol: 'ETH',
              name: 'Ethereum',
              kind: 'token' as const,
              signals: [{ id: 'volume_burst', label: 'Volume Burst', value: 3, unit: 'x', severity: 'info' as const, timestamp: new Date().toISOString() }],
              price: 3000,
              priceChange24h: 3,
              volume24h: 500000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      // Asset 1 has both signals
      vi.mocked(structureModule.detectStructureSignals)
        .mockReturnValueOnce([
          {
            id: 'trendline_break_up',
            label: 'Trendline Break (Up)',
            value: null,
            unit: null,
            severity: 'watch',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'fvg_bullish',
            label: 'Bullish FVG',
            value: 105,
            unit: null,
            severity: 'info',
            timestamp: new Date().toISOString(),
          },
        ])
        // Asset 2 has only one signal
        .mockReturnValueOnce([
          {
            id: 'trendline_break_up',
            label: 'Trendline Break (Up)',
            value: null,
            unit: null,
            severity: 'watch',
            timestamp: new Date().toISOString(),
          },
        ]);

      const opportunities = await listOpportunities({
        structureFilters: {
          trendlineBreak: true,
          fvg: true,
        },
      });

      // Only asset1 should pass (has both)
      expect(opportunities.length).toBe(1);
      expect(opportunities[0].symbol).toBe('BTC');

      const hasTrendlineBreak = opportunities[0].signals.some((s) =>
        s.id === 'trendline_break_up' || s.id === 'trendline_break_down'
      );
      const hasFVG = opportunities[0].signals.some((s) =>
        s.id === 'fvg_bullish' || s.id === 'fvg_bearish'
      );

      expect(hasTrendlineBreak).toBe(true);
      expect(hasFVG).toBe(true);
    });

    it('should return all opportunities when no structure filters applied', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
            {
              id: 'asset2',
              symbol: 'ETH',
              name: 'Ethereum',
              kind: 'token' as const,
              signals: [{ id: 'volume_burst', label: 'Volume Burst', value: 3, unit: 'x', severity: 'info' as const, timestamp: new Date().toISOString() }],
              price: 3000,
              priceChange24h: 3,
              volume24h: 500000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      const opportunities = await listOpportunities({});

      // Should return all opportunities
      expect(opportunities.length).toBe(2);
    });
  });

  describe('structure signal enrichment', () => {
    it('should enrich opportunities with structure signals', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'trendline_break_up',
          label: 'Trendline Break (Up)',
          value: null,
          unit: null,
          severity: 'watch',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({});

      // Should have both original and structure signals
      expect(opportunities[0].signals.length).toBeGreaterThan(1);

      const hasOriginalSignal = opportunities[0].signals.some((s) => s.id === 'price_spike');
      const hasStructureSignal = opportunities[0].signals.some((s) => s.id === 'trendline_break_up');

      expect(hasOriginalSignal).toBe(true);
      expect(hasStructureSignal).toBe(true);
    });

    it('should respect disabled signals from user preferences', async () => {
      const mockWatchlists = [
        {
          id: 'wl1',
          name: 'Test Watchlist',
          items: [
            {
              id: 'asset1',
              symbol: 'BTC',
              name: 'Bitcoin',
              kind: 'token' as const,
              signals: [{ id: 'price_spike', label: 'Price Spike', value: 5, unit: '%', severity: 'watch' as const, timestamp: new Date().toISOString() }],
              price: 50000,
              priceChange24h: 5,
              volume24h: 1000000,
            } as WatchlistItemEnriched,
          ],
        },
      ];

      vi.mocked(watchlistService.listWatchlistsEnriched).mockResolvedValue(mockWatchlists);
      vi.mocked(marketCandles.getCandlestickData).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() + i * 60000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        }))
      );

      // Mock user preferences with disabled trendline_break_up
      vi.mocked(signalPreferences.getCurrentUserSignalPreferences).mockResolvedValue({
        defaultMinSeverity: 'info',
        signalPreferences: [
          { signalId: 'trendline_break_up', enabled: false, minSeverity: null },
        ],
      });

      vi.mocked(structureModule.detectStructureSignals).mockReturnValue([
        {
          id: 'trendline_break_up',
          label: 'Trendline Break (Up)',
          value: null,
          unit: null,
          severity: 'watch',
          timestamp: new Date().toISOString(),
        },
      ]);

      const opportunities = await listOpportunities({});

      // Structure signal should be filtered out
      const hasDisabledSignal = opportunities[0].signals.some((s) => s.id === 'trendline_break_up');
      expect(hasDisabledSignal).toBe(false);
    });
  });
});

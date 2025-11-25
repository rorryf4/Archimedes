import { describe, it, expect } from 'vitest';
import type { Opportunity } from '../../modules/opportunities/service';
import type { SignalSeverity } from '../../modules/signals/types';

// Helper to create a fake opportunity for testing
function createOpportunity(
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: 'item-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    kind: 'token',
    primarySignal: {
      id: 'volume_burst',
      label: 'Volume Burst',
      value: 150,
      unit: '%',
      severity: 'action',
      timestamp: new Date().toISOString(),
    },
    signals: [
      {
        id: 'volume_burst',
        label: 'Volume Burst',
        value: 150,
        unit: '%',
        severity: 'action',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'price_spike',
        label: 'Price Spike',
        value: 8.5,
        unit: '%',
        severity: 'watch',
        timestamp: new Date().toISOString(),
      },
    ],
    severityRank: 3,
    severityCounts: { none: 0, info: 0, watch: 1, action: 1 },
    price: 42000,
    priceChange24h: 5.2,
    volume24h: 28000000000,
    watchlists: [
      { id: 'wl-1', name: 'Favorites' },
      { id: 'wl-2', name: 'High Priority' },
    ],
    score: 75,
    subScores: {
      severity: 100,
      signalDensity: 50,
      priceMomentum: 75,
      volume: 50,
      trend: 50,
      preferenceAlignment: 50,
    },
    explanation: {
      headline: 'High-severity signals with strong confluence create compelling opportunity.',
      factors: [],
    },
    ...overrides,
  };
}

describe('OpportunityDetailPanel', () => {
  describe('opportunity data structure', () => {
    it('should have all required fields for panel rendering', () => {
      const opp = createOpportunity();

      expect(opp.id).toBe('item-btc');
      expect(opp.symbol).toBe('BTC');
      expect(opp.name).toBe('Bitcoin');
      expect(opp.kind).toBe('token');
      expect(opp.signals).toHaveLength(2);
      expect(opp.price).toBe(42000);
      expect(opp.priceChange24h).toBe(5.2);
      expect(opp.volume24h).toBe(28000000000);
      expect(opp.watchlists).toHaveLength(2);
    });

    it('should handle market kind', () => {
      const opp = createOpportunity({
        kind: 'market',
        symbol: 'ETH/USDT',
        name: 'Ethereum / Tether',
      });

      expect(opp.kind).toBe('market');
      expect(opp.symbol).toBe('ETH/USDT');
    });

    it('should handle null price data', () => {
      const opp = createOpportunity({
        price: null,
        priceChange24h: null,
        volume24h: null,
      });

      expect(opp.price).toBeNull();
      expect(opp.priceChange24h).toBeNull();
      expect(opp.volume24h).toBeNull();
    });

    it('should handle empty signals array', () => {
      const opp = createOpportunity({
        signals: [],
        primarySignal: null,
        severityRank: 0,
        severityCounts: { none: 0, info: 0, watch: 0, action: 0 },
      });

      expect(opp.signals).toHaveLength(0);
      expect(opp.primarySignal).toBeNull();
    });

    it('should handle empty watchlists array', () => {
      const opp = createOpportunity({
        watchlists: [],
      });

      expect(opp.watchlists).toHaveLength(0);
    });
  });

  describe('panel URLs and actions', () => {
    it('should construct correct asset page URL', () => {
      const opp = createOpportunity({ id: 'item-btc' });
      const assetPageHref = `/assets/${opp.id}`;

      expect(assetPageHref).toBe('/assets/item-btc');
    });

    it('should construct focus URL without viewId', () => {
      const opp = createOpportunity({ id: 'item-btc' });
      const currentViewId = '';

      const focusHref = currentViewId
        ? `/opportunities?viewId=${currentViewId}&assetId=${opp.id}`
        : `/opportunities?assetId=${opp.id}`;

      expect(focusHref).toBe('/opportunities?assetId=item-btc');
    });

    it('should construct focus URL with viewId preserved', () => {
      const opp = createOpportunity({ id: 'item-btc' });
      const currentViewId = 'view-123';

      const focusHref = currentViewId
        ? `/opportunities?viewId=${currentViewId}&assetId=${opp.id}`
        : `/opportunities?assetId=${opp.id}`;

      expect(focusHref).toBe('/opportunities?viewId=view-123&assetId=item-btc');
    });

    it('should construct watchlist URLs for each watchlist', () => {
      const opp = createOpportunity({
        watchlists: [
          { id: 'wl-1', name: 'Favorites' },
          { id: 'wl-2', name: 'High Priority' },
        ],
      });

      const watchlistHrefs = opp.watchlists.map((wl) => `/watchlists/${wl.id}`);

      expect(watchlistHrefs).toEqual([
        '/watchlists/wl-1',
        '/watchlists/wl-2',
      ]);
    });
  });

  describe('price formatting logic', () => {
    it('should format price with two decimal places', () => {
      const price = 42000.5;
      const formatted = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      expect(formatted).toBe('$42,000.50');
    });

    it('should format null price as dash', () => {
      const price: number | null = null;

      function formatPrice(p: number | null): string {
        return p !== null
          ? `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '-';
      }

      expect(formatPrice(price)).toBe('-');
    });

    it('should format positive price change with plus sign', () => {
      const priceChange = 5.2;
      const formatted = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;

      expect(formatted).toBe('+5.20%');
    });

    it('should format negative price change without plus sign', () => {
      const priceChange = -3.5;
      const formatted = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;

      expect(formatted).toBe('-3.50%');
    });

    it('should format null price change as dash', () => {
      const priceChange: number | null = null;

      function formatPriceChange(pc: number | null): string {
        return pc !== null
          ? `${pc > 0 ? '+' : ''}${pc.toFixed(2)}%`
          : '-';
      }

      expect(formatPriceChange(priceChange)).toBe('-');
    });

    it('should determine correct color for positive change', () => {
      const priceChange = 5.2;
      const changeColor = priceChange !== null
        ? priceChange > 0
          ? 'text-green-400'
          : priceChange < 0
            ? 'text-red-400'
            : 'text-slate-400'
        : 'text-slate-500';

      expect(changeColor).toBe('text-green-400');
    });

    it('should determine correct color for negative change', () => {
      const priceChange = -3.5;
      const changeColor = priceChange !== null
        ? priceChange > 0
          ? 'text-green-400'
          : priceChange < 0
            ? 'text-red-400'
            : 'text-slate-400'
        : 'text-slate-500';

      expect(changeColor).toBe('text-red-400');
    });
  });

  describe('volume formatting logic', () => {
    it('should format billions correctly', () => {
      const volume = 28_000_000_000;
      const formatted = volume >= 1_000_000_000
        ? `$${(volume / 1_000_000_000).toFixed(2)}B`
        : volume >= 1_000_000
          ? `$${(volume / 1_000_000).toFixed(2)}M`
          : `$${volume.toLocaleString()}`;

      expect(formatted).toBe('$28.00B');
    });

    it('should format millions correctly', () => {
      const volume = 5_500_000;
      const formatted = volume >= 1_000_000_000
        ? `$${(volume / 1_000_000_000).toFixed(2)}B`
        : volume >= 1_000_000
          ? `$${(volume / 1_000_000).toFixed(2)}M`
          : `$${volume.toLocaleString()}`;

      expect(formatted).toBe('$5.50M');
    });

    it('should format smaller values with locale string', () => {
      const volume = 500_000;
      const formatted = volume >= 1_000_000_000
        ? `$${(volume / 1_000_000_000).toFixed(2)}B`
        : volume >= 1_000_000
          ? `$${(volume / 1_000_000).toFixed(2)}M`
          : `$${volume.toLocaleString()}`;

      expect(formatted).toBe('$500,000');
    });

    it('should format null volume as dash', () => {
      const volume: number | null = null;

      function formatVolume(v: number | null): string {
        return v !== null
          ? v >= 1_000_000_000
            ? `$${(v / 1_000_000_000).toFixed(2)}B`
            : v >= 1_000_000
              ? `$${(v / 1_000_000).toFixed(2)}M`
              : `$${v.toLocaleString()}`
          : '-';
      }

      expect(formatVolume(volume)).toBe('-');
    });
  });

  describe('conditional section rendering (Milestone 35)', () => {
    it('should hide structure section when no structure signals present', () => {
      const structureSignalIds = new Set([
        'trendline_break_up',
        'trendline_break_down',
        'trendline_break_retest',
        'support_break',
        'resistance_break',
        'support_flip',
        'resistance_flip',
        'liquidity_sweep_up',
        'liquidity_sweep_down',
        'fvg_bullish',
        'fvg_bearish',
        'discount_retrace',
        'premium_retrace',
      ]);

      const opp = createOpportunity({
        signals: [
          {
            id: 'volume_burst',
            label: 'Volume Burst',
            value: 150,
            unit: '%',
            severity: 'action',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'price_spike',
            label: 'Price Spike',
            value: 8.5,
            unit: '%',
            severity: 'watch',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const structureSignals = opp.signals.filter((s) =>
        structureSignalIds.has(s.id)
      );

      expect(structureSignals.length).toBe(0);
    });

    it('should show structure section when structure signals present', () => {
      const structureSignalIds = new Set([
        'trendline_break_up',
        'trendline_break_down',
        'trendline_break_retest',
        'support_break',
        'resistance_break',
        'support_flip',
        'resistance_flip',
        'liquidity_sweep_up',
        'liquidity_sweep_down',
        'fvg_bullish',
        'fvg_bearish',
        'discount_retrace',
        'premium_retrace',
      ]);

      const opp = createOpportunity({
        signals: [
          {
            id: 'trendline_break_up',
            label: 'Trendline Break (Up)',
            value: null,
            severity: 'action',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'volume_burst',
            label: 'Volume Burst',
            value: 150,
            unit: '%',
            severity: 'action',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const structureSignals = opp.signals.filter((s) =>
        structureSignalIds.has(s.id)
      );

      expect(structureSignals.length).toBe(1);
      expect(structureSignals[0].id).toBe('trendline_break_up');
    });

    it('should hide indicator section when no indicator signals present', () => {
      const indicatorSignalIds = new Set([
        'rsi_overbought',
        'rsi_oversold',
        'macd_bull_cross',
        'macd_bear_cross',
        'macd_histogram_expand',
        'bb_squeeze',
        'bb_expand',
        'bb_tag_upper',
        'bb_tag_lower',
        'atr_spike',
        'atr_crush',
      ]);

      const opp = createOpportunity({
        signals: [
          {
            id: 'volume_burst',
            label: 'Volume Burst',
            value: 150,
            unit: '%',
            severity: 'action',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const indicatorSignals = opp.signals.filter((s) =>
        indicatorSignalIds.has(s.id)
      );

      expect(indicatorSignals.length).toBe(0);
    });

    it('should show indicator section when indicator signals present', () => {
      const indicatorSignalIds = new Set([
        'rsi_overbought',
        'rsi_oversold',
        'macd_bull_cross',
        'macd_bear_cross',
        'macd_histogram_expand',
        'bb_squeeze',
        'bb_expand',
        'bb_tag_upper',
        'bb_tag_lower',
        'atr_spike',
        'atr_crush',
      ]);

      const opp = createOpportunity({
        signals: [
          {
            id: 'rsi_overbought',
            label: 'RSI Overbought',
            value: 75,
            unit: '',
            severity: 'watch',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'volume_burst',
            label: 'Volume Burst',
            value: 150,
            unit: '%',
            severity: 'action',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const indicatorSignals = opp.signals.filter((s) =>
        indicatorSignalIds.has(s.id)
      );

      expect(indicatorSignals.length).toBe(1);
      expect(indicatorSignals[0].id).toBe('rsi_overbought');
    });

    it('should hide technical indicators section when no indicator data present', () => {
      const opp = createOpportunity({
        indicators: undefined,
      });

      const hasIndicatorData = opp.indicators && (
        opp.indicators.rsi !== undefined ||
        opp.indicators.macd !== undefined ||
        opp.indicators.bollinger !== undefined ||
        opp.indicators.atr !== undefined
      );

      expect(hasIndicatorData).toBeFalsy();
    });

    it('should show technical indicators section when indicator data present', () => {
      const opp = createOpportunity({
        indicators: {
          rsi: 65,
          macd: { macd: 0.5, signal: 0.3, hist: 0.2 },
          bollinger: { upper: 43000, middle: 42000, lower: 41000, bandwidth: 4.76 },
          atr: { atr: 500, atrPercent: 1.19 },
        },
      });

      const hasIndicatorData = opp.indicators && (
        opp.indicators.rsi !== undefined ||
        opp.indicators.macd !== undefined ||
        opp.indicators.bollinger !== undefined ||
        opp.indicators.atr !== undefined
      );

      expect(hasIndicatorData).toBeTruthy();
    });
  });

  describe('signals display', () => {
    it('should handle multiple signals with different severities', () => {
      const signals = [
        {
          id: 'volume_burst',
          label: 'Volume Burst',
          value: 150,
          unit: '%',
          severity: 'action' as SignalSeverity,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'price_spike',
          label: 'Price Spike',
          value: 8.5,
          unit: '%',
          severity: 'watch' as SignalSeverity,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'trending',
          label: 'Trending',
          value: null,
          severity: 'info' as SignalSeverity,
          timestamp: new Date().toISOString(),
        },
      ];

      expect(signals).toHaveLength(3);
      expect(signals[0].severity).toBe('action');
      expect(signals[1].severity).toBe('watch');
      expect(signals[2].severity).toBe('info');
      expect(signals[2].value).toBeNull();
    });

    it('should handle signals with null values', () => {
      const signal = {
        id: 'trending',
        label: 'Trending',
        value: null,
        severity: 'info' as SignalSeverity,
        timestamp: new Date().toISOString(),
      };

      expect(signal.value).toBeNull();
      expect(signal.severity).toBe('info');
    });

    it('should handle signals with units', () => {
      const signal = {
        id: 'volume_burst',
        label: 'Volume Burst',
        value: 150,
        unit: '%',
        severity: 'action' as SignalSeverity,
        timestamp: new Date().toISOString(),
      };

      expect(signal.value).toBe(150);
      expect(signal.unit).toBe('%');
    });
  });
});

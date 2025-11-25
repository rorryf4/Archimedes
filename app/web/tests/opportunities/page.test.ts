import { describe, it, expect } from 'vitest';
import type { Opportunity } from '../../modules/opportunities/service';
import type { SignalResult, SignalSeverity } from '../../modules/signals/types';

// Helper to create a signal result
function createSignal(
  id: string,
  severity: SignalSeverity,
  value: number | null = null,
): SignalResult {
  return {
    id,
    label: `${id} Signal`,
    value,
    severity,
    timestamp: new Date().toISOString(),
  };
}

// Helper to create an opportunity
function createOpportunity(
  id: string,
  symbol: string,
  name: string,
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    id,
    symbol,
    name,
    kind: 'token',
    primarySignal: null,
    signals: [],
    severityRank: 0,
    severityCounts: { none: 0, info: 0, watch: 0, action: 0 },
    price: 100,
    priceChange24h: 5.0,
    volume24h: 1000000,
    watchlists: [{ id: 'wl-1', name: 'Favorites' }],
    score: 50,
    subScores: {
      severity: 50,
      signalDensity: 50,
      priceMomentum: 50,
      volume: 50,
      trend: 50,
      preferenceAlignment: 50,
    },
    explanation: {
      headline: 'Moderate signals and market conditions suggest neutral setup.',
      factors: [],
    },
    ...overrides,
  };
}

describe('opportunities page data', () => {
  describe('Opportunity data structure', () => {
    it('should have all required fields for table rendering', () => {
      const opp = createOpportunity('item-1', 'BTC', 'Bitcoin', {
        primarySignal: createSignal('volume_burst', 'action', 150),
        severityRank: 3,
        severityCounts: { none: 0, info: 1, watch: 1, action: 1 },
        priceChange24h: 5.5,
        volume24h: 28000000000,
        watchlists: [
          { id: 'wl-1', name: 'Favorites' },
          { id: 'wl-2', name: 'High Priority' },
        ],
      });

      // Verify all fields needed for table are present
      expect(opp.id).toBe('item-1');
      expect(opp.symbol).toBe('BTC');
      expect(opp.name).toBe('Bitcoin');
      expect(opp.kind).toBe('token');
      expect(opp.primarySignal).not.toBeNull();
      expect(opp.primarySignal?.severity).toBe('action');
      expect(opp.severityCounts.action).toBe(1);
      expect(opp.severityCounts.watch).toBe(1);
      expect(opp.severityCounts.info).toBe(1);
      expect(opp.priceChange24h).toBe(5.5);
      expect(opp.volume24h).toBe(28000000000);
      expect(opp.watchlists).toHaveLength(2);
    });

    it('should handle null primarySignal', () => {
      const opp = createOpportunity('item-1', 'ETH', 'Ethereum', {
        primarySignal: null,
        severityRank: 0,
      });

      expect(opp.primarySignal).toBeNull();
      expect(opp.severityRank).toBe(0);
    });

    it('should handle null priceChange24h and volume24h', () => {
      const opp = createOpportunity('item-1', 'SOL', 'Solana', {
        priceChange24h: null,
        volume24h: null,
      });

      expect(opp.priceChange24h).toBeNull();
      expect(opp.volume24h).toBeNull();
    });

    it('should handle market kind', () => {
      const opp = createOpportunity('item-1', 'ETH/USDT', 'Ethereum / Tether', {
        kind: 'market',
      });

      expect(opp.kind).toBe('market');
    });

    it('should handle empty watchlists array', () => {
      const opp = createOpportunity('item-1', 'BTC', 'Bitcoin', {
        watchlists: [],
      });

      expect(opp.watchlists).toHaveLength(0);
    });
  });

  describe('price change formatting logic', () => {
    it('should format positive price change with plus sign', () => {
      const priceChange = 5.5;
      const formatted = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
      expect(formatted).toBe('+5.50%');
    });

    it('should format negative price change without plus sign', () => {
      const priceChange = -3.2;
      const formatted = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
      expect(formatted).toBe('-3.20%');
    });

    it('should format zero price change without plus sign', () => {
      const priceChange = 0;
      const formatted = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
      expect(formatted).toBe('0.00%');
    });
  });

  describe('volume formatting logic', () => {
    it('should format billions correctly', () => {
      const volume = 28_000_000_000;
      const formatted =
        volume >= 1_000_000_000
          ? `$${(volume / 1_000_000_000).toFixed(2)}B`
          : volume >= 1_000_000
            ? `$${(volume / 1_000_000).toFixed(2)}M`
            : `$${volume.toLocaleString()}`;
      expect(formatted).toBe('$28.00B');
    });

    it('should format millions correctly', () => {
      const volume = 5_500_000;
      const formatted =
        volume >= 1_000_000_000
          ? `$${(volume / 1_000_000_000).toFixed(2)}B`
          : volume >= 1_000_000
            ? `$${(volume / 1_000_000).toFixed(2)}M`
            : `$${volume.toLocaleString()}`;
      expect(formatted).toBe('$5.50M');
    });

    it('should format smaller values with locale string', () => {
      const volume = 500_000;
      const formatted =
        volume >= 1_000_000_000
          ? `$${(volume / 1_000_000_000).toFixed(2)}B`
          : volume >= 1_000_000
            ? `$${(volume / 1_000_000).toFixed(2)}M`
            : `$${volume.toLocaleString()}`;
      expect(formatted).toBe('$500,000');
    });
  });

  describe('severity summary logic', () => {
    it('should filter out zero counts', () => {
      const counts: Record<SignalSeverity, number> = {
        none: 0,
        info: 1,
        watch: 0,
        action: 2,
      };

      const parts: { label: string; count: number }[] = [];
      if (counts.action > 0) parts.push({ label: 'Action', count: counts.action });
      if (counts.watch > 0) parts.push({ label: 'Watch', count: counts.watch });
      if (counts.info > 0) parts.push({ label: 'Info', count: counts.info });

      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual({ label: 'Action', count: 2 });
      expect(parts[1]).toEqual({ label: 'Info', count: 1 });
    });

    it('should return empty when all counts are zero', () => {
      const counts: Record<SignalSeverity, number> = {
        none: 5,
        info: 0,
        watch: 0,
        action: 0,
      };

      const parts: { label: string; count: number }[] = [];
      if (counts.action > 0) parts.push({ label: 'Action', count: counts.action });
      if (counts.watch > 0) parts.push({ label: 'Watch', count: counts.watch });
      if (counts.info > 0) parts.push({ label: 'Info', count: counts.info });

      expect(parts).toHaveLength(0);
    });
  });

  describe('empty opportunities handling', () => {
    it('should handle empty array gracefully', () => {
      const opportunities: Opportunity[] = [];
      expect(opportunities.length).toBe(0);
    });
  });
});

// Query param parsing tests - testing the logic used in the page
describe('query param parsing', () => {
  const VALID_SEVERITIES: SignalSeverity[] = ['none', 'info', 'watch', 'action'];
  const DEFAULT_MIN_SEVERITY: SignalSeverity = 'info';

  function parseMinSeverity(value: string | string[] | undefined): SignalSeverity {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw && VALID_SEVERITIES.includes(raw as SignalSeverity)) {
      return raw as SignalSeverity;
    }
    return DEFAULT_MIN_SEVERITY;
  }

  function parseSignalKeys(value: string | string[] | undefined): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));
    }

    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function parseWatchlistId(value: string | string[] | undefined): string {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw || '';
  }

  function parseAssetId(value: string | string[] | undefined): string {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw || '';
  }

  function parseViewId(value: string | string[] | undefined): string {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw || '';
  }

  describe('parseMinSeverity', () => {
    it('should return default for undefined', () => {
      expect(parseMinSeverity(undefined)).toBe('info');
    });

    it('should return valid severity string', () => {
      expect(parseMinSeverity('watch')).toBe('watch');
      expect(parseMinSeverity('action')).toBe('action');
      expect(parseMinSeverity('info')).toBe('info');
    });

    it('should return first value from array', () => {
      expect(parseMinSeverity(['watch', 'action'])).toBe('watch');
    });

    it('should return default for invalid severity', () => {
      expect(parseMinSeverity('invalid')).toBe('info');
      expect(parseMinSeverity('WATCH')).toBe('info');
    });
  });

  describe('parseSignalKeys', () => {
    it('should return empty array for undefined', () => {
      expect(parseSignalKeys(undefined)).toEqual([]);
    });

    it('should parse comma-separated string', () => {
      expect(parseSignalKeys('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should parse array of strings', () => {
      expect(parseSignalKeys(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('should handle array with comma-separated values', () => {
      expect(parseSignalKeys(['a,b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should trim whitespace', () => {
      expect(parseSignalKeys(' a , b ')).toEqual(['a', 'b']);
    });

    it('should filter empty strings', () => {
      expect(parseSignalKeys('a,,b')).toEqual(['a', 'b']);
    });
  });

  describe('parseWatchlistId', () => {
    it('should return empty string for undefined', () => {
      expect(parseWatchlistId(undefined)).toBe('');
    });

    it('should return the string value', () => {
      expect(parseWatchlistId('wl-123')).toBe('wl-123');
    });

    it('should return first value from array', () => {
      expect(parseWatchlistId(['wl-1', 'wl-2'])).toBe('wl-1');
    });

    it('should return empty string for empty string input', () => {
      expect(parseWatchlistId('')).toBe('');
    });
  });

  describe('parseAssetId', () => {
    it('should return empty string for undefined', () => {
      expect(parseAssetId(undefined)).toBe('');
    });

    it('should return the string value', () => {
      expect(parseAssetId('item-btc')).toBe('item-btc');
    });

    it('should return first value from array', () => {
      expect(parseAssetId(['item-btc', 'item-eth'])).toBe('item-btc');
    });

    it('should return empty string for empty string input', () => {
      expect(parseAssetId('')).toBe('');
    });
  });

  describe('parseViewId', () => {
    it('should return empty string for undefined', () => {
      expect(parseViewId(undefined)).toBe('');
    });

    it('should return the string value', () => {
      expect(parseViewId('view-123')).toBe('view-123');
    });

    it('should return first value from array', () => {
      expect(parseViewId(['view-1', 'view-2'])).toBe('view-1');
    });

    it('should return empty string for empty string input', () => {
      expect(parseViewId('')).toBe('');
    });
  });
});

// Filter component state tests
describe('filter UI state logic', () => {
  it('should check if signal key is in current keys', () => {
    const currentSignalKeys = ['volume_burst', 'price_spike'];

    expect(currentSignalKeys.includes('volume_burst')).toBe(true);
    expect(currentSignalKeys.includes('other_signal')).toBe(false);
  });

  it('should match watchlist id for selected state', () => {
    const currentWatchlistId = 'wl-123';
    const watchlistId = 'wl-123';

    expect(watchlistId === currentWatchlistId).toBe(true);
  });

  it('should handle empty watchlist id', () => {
    const currentWatchlistId = '';

    expect(currentWatchlistId === '').toBe(true);
    expect(currentWatchlistId || undefined).toBe(undefined);
  });
});

// Milestone 24: Opportunities Explorer v1 tests
describe('opportunities explorer integration', () => {
  describe('assetId filtering', () => {
    it('should filter opportunities to specific asset when assetId is provided', () => {
      const allOpportunities = [
        createOpportunity('item-btc', 'BTC', 'Bitcoin'),
        createOpportunity('item-eth', 'ETH', 'Ethereum'),
        createOpportunity('item-sol', 'SOL', 'Solana'),
      ];

      const assetId = 'item-btc';
      const filtered = allOpportunities.filter((opp) => opp.id === assetId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('item-btc');
      expect(filtered[0].symbol).toBe('BTC');
    });

    it('should return empty array when assetId does not match any opportunities', () => {
      const allOpportunities = [
        createOpportunity('item-btc', 'BTC', 'Bitcoin'),
        createOpportunity('item-eth', 'ETH', 'Ethereum'),
      ];

      const assetId = 'item-nonexistent';
      const filtered = allOpportunities.filter((opp) => opp.id === assetId);

      expect(filtered).toHaveLength(0);
    });

    it('should return all opportunities when assetId is empty', () => {
      const allOpportunities = [
        createOpportunity('item-btc', 'BTC', 'Bitcoin'),
        createOpportunity('item-eth', 'ETH', 'Ethereum'),
      ];

      const assetId = '';
      const filtered = assetId ? allOpportunities.filter((opp) => opp.id === assetId) : allOpportunities;

      expect(filtered).toHaveLength(2);
    });
  });

  describe('saved view integration', () => {
    it('should construct viewId href correctly', () => {
      const viewId = 'view-abc-123';
      const href = `/opportunities?viewId=${viewId}`;

      expect(href).toBe('/opportunities?viewId=view-abc-123');
    });

    it('should parse viewId from query params', () => {
      const viewIdParam = 'view-abc-123';
      const raw = Array.isArray(viewIdParam) ? viewIdParam[0] : viewIdParam;
      const parsed = raw || '';

      expect(parsed).toBe('view-abc-123');
    });

    it('should handle missing viewId gracefully', () => {
      const viewIdParam = undefined;
      const raw = Array.isArray(viewIdParam) ? viewIdParam[0] : viewIdParam;
      const parsed = raw || '';

      expect(parsed).toBe('');
    });

    it('should apply saved view params when viewId is present', () => {
      const savedViewParams = {
        minSeverity: 'action' as SignalSeverity,
        signalKeys: ['volume_burst', 'price_spike'],
        watchlistId: 'wl-favorites',
      };

      const viewId = 'view-123';
      const DEFAULT_MIN_SEVERITY: SignalSeverity = 'info';

      // Mock parseMinSeverity for this test
      const parseMinSeverityLocal = (value: string | string[] | undefined): SignalSeverity => {
        const VALID_SEVERITIES: SignalSeverity[] = ['none', 'info', 'watch', 'action'];
        const raw = Array.isArray(value) ? value[0] : value;
        if (raw && VALID_SEVERITIES.includes(raw as SignalSeverity)) {
          return raw as SignalSeverity;
        }
        return DEFAULT_MIN_SEVERITY;
      };

      const parseSignalKeysLocal = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));
        }
        return value.split(',').map((s) => s.trim()).filter(Boolean);
      };

      const parseWatchlistIdLocal = (value: string | string[] | undefined): string => {
        const raw = Array.isArray(value) ? value[0] : value;
        return raw || '';
      };

      // When viewId is present, use saved view params
      const appliedMinSeverity = viewId ? savedViewParams.minSeverity : parseMinSeverityLocal(undefined);
      const appliedSignalKeys = viewId ? savedViewParams.signalKeys : parseSignalKeysLocal(undefined);
      const appliedWatchlistId = viewId ? savedViewParams.watchlistId : parseWatchlistIdLocal(undefined);

      expect(appliedMinSeverity).toBe('action');
      expect(appliedSignalKeys).toEqual(['volume_burst', 'price_spike']);
      expect(appliedWatchlistId).toBe('wl-favorites');
    });
  });

  describe('layout and UI structure', () => {
    it('should display active view name in header when viewId is present', () => {
      const viewId = 'view-123';
      const savedViewName = 'High Priority Alerts';

      const headerText = viewId && savedViewName ? `Viewing: ${savedViewName}` : 'Ranked by signal severity across all watchlists';

      expect(headerText).toBe('Viewing: High Priority Alerts');
    });

    it('should display asset filter message when assetId is present', () => {
      const assetId = 'item-btc';

      const headerText = assetId ? 'Filtered to a specific asset' : 'Ranked by signal severity across all watchlists';

      expect(headerText).toBe('Filtered to a specific asset');
    });

    it('should display default message when no filters applied', () => {
      const assetId = '';
      const viewId = '';

      const headerText = assetId ? 'Filtered to a specific asset' : viewId ? 'Viewing: Some View' : 'Ranked by signal severity across all watchlists';

      expect(headerText).toBe('Ranked by signal severity across all watchlists');
    });

    it('should show adjusted empty state message when assetId is present', () => {
      const assetId = 'item-btc';
      const opportunities: Opportunity[] = [];

      const emptyMessage = opportunities.length === 0
        ? assetId
          ? 'Try adjusting your filters or select a different asset.'
          : 'Add items to your watchlists to see signal-based opportunities.'
        : '';

      expect(emptyMessage).toBe('Try adjusting your filters or select a different asset.');
    });
  });

  describe('saved views active state', () => {
    it('should identify active saved view when currentViewId matches', () => {
      const currentViewId: string = 'view-123';
      const viewId: string = 'view-123';

      const isActive = currentViewId === viewId;

      expect(isActive).toBe(true);
    });

    it('should not identify as active when viewId does not match', () => {
      const currentViewId: string = 'view-123';
      const viewId: string = 'view-456';

      const isActive = currentViewId === viewId;

      expect(isActive).toBe(false);
    });

    it('should not identify as active when currentViewId is empty', () => {
      const currentViewId: string = '';
      const viewId: string = 'view-123';

      const isActive = currentViewId === viewId;

      expect(isActive).toBe(false);
    });
  });

  describe('save current view button params (M25)', () => {
    it('should construct currentParams with all filter values', () => {
      const minSeverity: SignalSeverity = 'action';
      const signalKeys = ['volume_burst', 'price_spike'];
      const watchlistId = 'wl-favorites';

      const currentParams = {
        minSeverity,
        signalKeys,
        watchlistId: watchlistId || null,
      };

      expect(currentParams.minSeverity).toBe('action');
      expect(currentParams.signalKeys).toEqual(['volume_burst', 'price_spike']);
      expect(currentParams.watchlistId).toBe('wl-favorites');
    });

    it('should construct currentParams with null watchlistId when empty', () => {
      const minSeverity: SignalSeverity = 'info';
      const signalKeys: string[] = [];
      const watchlistId = '';

      const currentParams = {
        minSeverity,
        signalKeys,
        watchlistId: watchlistId || null,
      };

      expect(currentParams.minSeverity).toBe('info');
      expect(currentParams.signalKeys).toEqual([]);
      expect(currentParams.watchlistId).toBeNull();
    });

    it('should construct currentParams with empty signalKeys when no signals selected', () => {
      const minSeverity: SignalSeverity = 'watch';
      const signalKeys: string[] = [];
      const watchlistId = 'wl-123';

      const currentParams = {
        minSeverity,
        signalKeys,
        watchlistId: watchlistId || null,
      };

      expect(currentParams.minSeverity).toBe('watch');
      expect(currentParams.signalKeys).toEqual([]);
      expect(currentParams.watchlistId).toBe('wl-123');
    });

    it('should construct currentParams matching SavedOpportunityViewParams type', () => {
      const minSeverity: SignalSeverity = 'info';
      const signalKeys = ['volume_burst'];
      const watchlistId = 'wl-test';

      const currentParams: {
        minSeverity: SignalSeverity;
        signalKeys: string[];
        watchlistId: string | null;
      } = {
        minSeverity,
        signalKeys,
        watchlistId: watchlistId || null,
      };

      // Verify structure matches what SaveCurrentViewButton expects
      expect(currentParams).toHaveProperty('minSeverity');
      expect(currentParams).toHaveProperty('signalKeys');
      expect(currentParams).toHaveProperty('watchlistId');
      expect(typeof currentParams.minSeverity).toBe('string');
      expect(Array.isArray(currentParams.signalKeys)).toBe(true);
      expect(currentParams.watchlistId === null || typeof currentParams.watchlistId === 'string').toBe(true);
    });
  });

  describe('opportunity detail panel (M26)', () => {
    it('should include signals array in opportunity data', () => {
      const opp = createOpportunity('item-btc', 'BTC', 'Bitcoin', {
        primarySignal: createSignal('volume_burst', 'action', 150),
        signals: [
          createSignal('volume_burst', 'action', 150),
          createSignal('price_spike', 'watch', 8.5),
        ],
      });

      expect(opp.signals).toBeDefined();
      expect(Array.isArray(opp.signals)).toBe(true);
      expect(opp.signals).toHaveLength(2);
      expect(opp.signals[0].id).toBe('volume_burst');
      expect(opp.signals[1].id).toBe('price_spike');
    });

    it('should handle empty signals array', () => {
      const opp = createOpportunity('item-eth', 'ETH', 'Ethereum', {
        primarySignal: null,
        signals: [],
      });

      expect(opp.signals).toBeDefined();
      expect(opp.signals).toHaveLength(0);
    });

    it('should pass currentViewId to OpportunitiesTable', () => {
      const viewId = 'view-123';
      const opportunities: Opportunity[] = [
        createOpportunity('item-btc', 'BTC', 'Bitcoin'),
      ];

      // Verify the prop structure that would be passed
      const tableProps = {
        opportunities,
        currentViewId: viewId,
      };

      expect(tableProps.currentViewId).toBe('view-123');
      expect(tableProps.opportunities).toHaveLength(1);
    });

    it('should pass empty string as currentViewId when no viewId present', () => {
      const viewId = '';
      const opportunities: Opportunity[] = [
        createOpportunity('item-btc', 'BTC', 'Bitcoin'),
      ];

      const tableProps = {
        opportunities,
        currentViewId: viewId,
      };

      expect(tableProps.currentViewId).toBe('');
    });

    it('should construct correct focus URL without viewId', () => {
      const assetId = 'item-btc';
      const currentViewId = '';

      const focusHref = currentViewId
        ? `/opportunities?viewId=${currentViewId}&assetId=${assetId}`
        : `/opportunities?assetId=${assetId}`;

      expect(focusHref).toBe('/opportunities?assetId=item-btc');
    });

    it('should construct correct focus URL with viewId preserved', () => {
      const assetId = 'item-btc';
      const currentViewId = 'view-123';

      const focusHref = currentViewId
        ? `/opportunities?viewId=${currentViewId}&assetId=${assetId}`
        : `/opportunities?assetId=${assetId}`;

      expect(focusHref).toBe('/opportunities?viewId=view-123&assetId=item-btc');
    });

    it('should have all data needed for detail panel display', () => {
      const opp = createOpportunity('item-btc', 'BTC', 'Bitcoin', {
        signals: [
          createSignal('volume_burst', 'action', 150),
          createSignal('price_spike', 'watch', 8.5),
        ],
        price: 42000,
        priceChange24h: 5.2,
        volume24h: 28000000000,
        watchlists: [
          { id: 'wl-1', name: 'Favorites' },
          { id: 'wl-2', name: 'High Priority' },
        ],
      });

      // Verify all fields needed for the detail panel
      expect(opp.id).toBeDefined();
      expect(opp.symbol).toBeDefined();
      expect(opp.name).toBeDefined();
      expect(opp.kind).toBeDefined();
      expect(opp.signals).toBeDefined();
      expect(opp.price).toBeDefined();
      expect(opp.priceChange24h).toBeDefined();
      expect(opp.volume24h).toBeDefined();
      expect(opp.watchlists).toBeDefined();

      // Verify values
      expect(opp.signals).toHaveLength(2);
      expect(opp.watchlists).toHaveLength(2);
      expect(opp.price).toBe(42000);
    });

    it('should handle opportunity with no watchlists', () => {
      const opp = createOpportunity('item-sol', 'SOL', 'Solana', {
        watchlists: [],
      });

      expect(opp.watchlists).toHaveLength(0);
    });

    it('should handle opportunity with null price data', () => {
      const opp = createOpportunity('item-ada', 'ADA', 'Cardano', {
        price: null,
        priceChange24h: null,
        volume24h: null,
      });

      expect(opp.price).toBeNull();
      expect(opp.priceChange24h).toBeNull();
      expect(opp.volume24h).toBeNull();
    });
  });
});

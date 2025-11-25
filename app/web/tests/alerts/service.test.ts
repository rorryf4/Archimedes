import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listAlertsForCurrentUser,
  createAlertForCurrentUser,
  evaluateAlertsForOpportunities,
  listTriggeredAlertEventsForCurrentUser,
} from '../../modules/alerts/service';
import { clearAllAlerts } from '../../modules/alerts/repository.memory';
import { clearAllTriggeredAlertEvents } from '../../modules/alerts/events.repository.memory';
import { clearDedupingState } from '../../modules/alerts/deduping';
import type { Opportunity } from '../../modules/opportunities/service';
import type { SignalResult } from '../../modules/signals/types';

// Mock user context from watchlists/data
vi.mock('../../modules/watchlists/data', () => ({
  getCurrentUserContext: vi.fn(() => ({ userId: 'test-user' })),
}));

function createOpportunity(
  id: string,
  symbol: string,
  name: string,
  signals: SignalResult[],
  watchlistIds: string[] = ['wl-1']
): Opportunity {
  const primarySignal = signals.length > 0 ? signals[0] : null;
  const severityRank = primarySignal
    ? { none: 0, info: 1, watch: 2, action: 3 }[primarySignal.severity]
    : 0;

  return {
    id,
    kind: 'token',
    symbol,
    name,
    signals,
    watchlists: watchlistIds.map((wlId) => ({ id: wlId, name: `Watchlist ${wlId}` })),
    primarySignal,
    severityRank,
    severityCounts: { none: 0, info: 0, watch: 0, action: 0 },
    price: 100,
    priceChange24h: 5.0,
    volume24h: 1000000,
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
  };
}

function createSignal(
  id: string,
  severity: 'none' | 'info' | 'watch' | 'action',
  value: number | null = null
): SignalResult {
  return {
    id,
    label: `${id} Signal`,
    value,
    severity,
    timestamp: new Date().toISOString(),
  };
}

describe('Alert Service', () => {
  beforeEach(() => {
    clearAllAlerts();
    clearAllTriggeredAlertEvents();
    clearDedupingState();
  });

  describe('CRUD operations', () => {
    it('should create and list alerts', async () => {
      const alert = await createAlertForCurrentUser({
        kind: 'signal-threshold',
        name: 'High Volume Alert',
        signalId: 'volume_burst',
        minSeverity: 'action',
      });

      expect(alert.name).toBe('High Volume Alert');

      const alerts = await listAlertsForCurrentUser();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe(alert.id);
    });
  });

  describe('evaluateAlertsForOpportunities', () => {
    describe('signal-threshold alerts', () => {
      it('should trigger when opportunity has signal at exact minSeverity', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
        expect(triggeredEvents[0].alertName).toBe('Volume Alert');
        expect(triggeredEvents[0].opportunitySymbol).toBe('BTC');
        expect(triggeredEvents[0].triggeringSignalId).toBe('volume_burst');
      });

      it('should trigger when opportunity has signal above minSeverity', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'watch',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
      });

      it('should not trigger when signal severity is below minSeverity', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'watch', 100)]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });

      it('should not trigger when opportunity does not have the signal', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('price_move', 'action', 200)]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });

      it('should trigger for multiple opportunities', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
          createOpportunity('opp-2', 'ETH', 'Ethereum', [
            createSignal('volume_burst', 'action', 140),
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(2);
        expect(triggeredEvents[0].opportunitySymbol).toBe('BTC');
        expect(triggeredEvents[1].opportunitySymbol).toBe('ETH');
      });

      it('should not trigger disabled alerts', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Disabled Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
          enabled: false,
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });
    });

    describe('view-trigger alerts', () => {
      it('should trigger when opportunity matches minSeverity', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'High Severity View',
          viewParams: {
            minSeverity: 'action',
            signalKeys: [],
            watchlistId: null,
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'action', 150)]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
        expect(triggeredEvents[0].alertName).toBe('High Severity View');
        expect(triggeredEvents[0].triggeringSignalId).toBeNull();
      });

      it('should not trigger when opportunity severity is below minSeverity', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'High Severity View',
          viewParams: {
            minSeverity: 'action',
            signalKeys: [],
            watchlistId: null,
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'watch', 100)]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });

      it('should trigger when opportunity has matching signal key', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'Volume View',
          viewParams: {
            minSeverity: 'info',
            signalKeys: ['volume_burst'],
            watchlistId: null,
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
      });

      it('should not trigger when opportunity lacks matching signal key', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'Volume View',
          viewParams: {
            minSeverity: 'info',
            signalKeys: ['volume_burst'],
            watchlistId: null,
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('price_move', 'action', 200)]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });

      it('should trigger when opportunity is in matching watchlist', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'Watchlist View',
          viewParams: {
            minSeverity: 'info',
            signalKeys: [],
            watchlistId: 'wl-1',
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'action', 150)], [
            'wl-1',
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
      });

      it('should not trigger when opportunity is not in matching watchlist', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'Watchlist View',
          viewParams: {
            minSeverity: 'info',
            signalKeys: [],
            watchlistId: 'wl-1',
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'action', 150)], [
            'wl-2',
          ]),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(0);
      });

      it('should trigger when all view params match', async () => {
        await createAlertForCurrentUser({
          kind: 'view-trigger',
          name: 'Complex View',
          viewParams: {
            minSeverity: 'action',
            signalKeys: ['volume_burst'],
            watchlistId: 'wl-1',
          },
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ], ['wl-1']),
        ];

        const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

        expect(triggeredEvents).toHaveLength(1);
      });
    });

    describe('event persistence', () => {
      it('should append triggered events to the event log', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Test Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunities = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [
            createSignal('volume_burst', 'action', 150),
          ]),
        ];

        await evaluateAlertsForOpportunities(opportunities);

        const events = await listTriggeredAlertEventsForCurrentUser();
        expect(events).toHaveLength(1);
        expect(events[0].alertName).toBe('Test Alert');
      });

      it('should accumulate events across multiple evaluations', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Test Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opp1 = [
          createOpportunity('opp-1', 'BTC', 'Bitcoin', [createSignal('volume_burst', 'action', 150)]),
        ];

        const opp2 = [
          createOpportunity('opp-2', 'ETH', 'Ethereum', [
            createSignal('volume_burst', 'action', 140),
          ]),
        ];

        await evaluateAlertsForOpportunities(opp1);
        await evaluateAlertsForOpportunities(opp2);

        const events = await listTriggeredAlertEventsForCurrentUser();
        expect(events).toHaveLength(2);
      });
    });

    describe('deduping behavior', () => {
      it('should not trigger same alert for same opportunity twice within cooldown', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Test Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opportunity = createOpportunity('opp-1', 'BTC', 'Bitcoin', [
          createSignal('volume_burst', 'action', 150),
        ]);

        // First evaluation should trigger
        const firstRun = await evaluateAlertsForOpportunities([opportunity]);
        expect(firstRun).toHaveLength(1);

        // Second evaluation should NOT trigger (deduped)
        const secondRun = await evaluateAlertsForOpportunities([opportunity]);
        expect(secondRun).toHaveLength(0);
      });

      it('should allow triggering same alert for different opportunities', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Test Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        const opp1 = createOpportunity('opp-1', 'BTC', 'Bitcoin', [
          createSignal('volume_burst', 'action', 150),
        ]);
        const opp2 = createOpportunity('opp-2', 'ETH', 'Ethereum', [
          createSignal('volume_burst', 'action', 140),
        ]);

        const triggeredEvents = await evaluateAlertsForOpportunities([opp1, opp2]);
        expect(triggeredEvents).toHaveLength(2);
      });

      it('should allow different alerts for same opportunity', async () => {
        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Volume Alert',
          signalId: 'volume_burst',
          minSeverity: 'action',
        });

        await createAlertForCurrentUser({
          kind: 'signal-threshold',
          name: 'Price Alert',
          signalId: 'price_move',
          minSeverity: 'action',
        });

        const opportunity = createOpportunity('opp-1', 'BTC', 'Bitcoin', [
          createSignal('volume_burst', 'action', 150),
          createSignal('price_move', 'action', 200),
        ]);

        const triggeredEvents = await evaluateAlertsForOpportunities([opportunity]);
        expect(triggeredEvents).toHaveLength(2);
      });
    });
  });
});

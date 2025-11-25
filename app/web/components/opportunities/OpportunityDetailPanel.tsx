'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Opportunity } from '@/modules/opportunities/service';
import type { SignalResult } from '@/modules/signals/types';
import { getSeverityMeta } from '@/modules/signals';
import { OpportunityPriceChart } from './OpportunityPriceChart';

interface OpportunityDetailPanelProps {
  opportunity: Opportunity;
  onClose: () => void;
  currentViewId?: string;
}

function SignalBadge({ signal }: { signal: SignalResult }) {
  const meta = getSeverityMeta(signal.severity);
  const colorMap: Record<string, string> = {
    gray: 'bg-slate-700 text-slate-300',
    blue: 'bg-blue-900/50 text-blue-300',
    yellow: 'bg-yellow-900/50 text-yellow-300',
    red: 'bg-red-900/50 text-red-300',
  };
  const colorClass = colorMap[meta.color] || colorMap.gray;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{signal.label}</span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
        {meta.label}
        {signal.value !== null && signal.unit && (
          <span className="ml-1 text-xs opacity-80">
            {signal.value.toFixed(2)}{signal.unit}
          </span>
        )}
      </span>
    </div>
  );
}

function ScoreBadge({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
  let colorClass: string;
  let label: string;

  if (score >= 80) {
    colorClass = 'bg-green-900/50 text-green-300 border-green-700';
    label = 'Strong';
  } else if (score >= 60) {
    colorClass = 'bg-blue-900/50 text-blue-300 border-blue-700';
    label = 'Good';
  } else if (score >= 40) {
    colorClass = 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
    label = 'Meh';
  } else {
    colorClass = 'bg-red-900/50 text-red-300 border-red-700';
    label = 'Weak';
  }

  if (size === 'small') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold border ${colorClass}`}
      >
        {score}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <span
        className={`inline-flex items-center px-4 py-2 rounded-lg text-3xl font-bold border-2 ${colorClass}`}
      >
        {score}
      </span>
      <span className="text-sm text-slate-400 mt-1">{label}</span>
    </div>
  );
}

function SubScoreBar({ label, score }: { label: string; score: number }) {
  let barColor: string;
  if (score >= 80) {
    barColor = 'bg-green-600';
  } else if (score >= 60) {
    barColor = 'bg-blue-600';
  } else if (score >= 40) {
    barColor = 'bg-yellow-600';
  } else {
    barColor = 'bg-red-600';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-slate-300">{score}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function OpportunityDetailPanel({ opportunity, onClose, currentViewId }: OpportunityDetailPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const priceFormatted = opportunity.price !== null
    ? `$${opportunity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '-';

  const changeFormatted = opportunity.priceChange24h !== null
    ? `${opportunity.priceChange24h > 0 ? '+' : ''}${opportunity.priceChange24h.toFixed(2)}%`
    : '-';

  const changeColor = opportunity.priceChange24h !== null
    ? opportunity.priceChange24h > 0
      ? 'text-green-400'
      : opportunity.priceChange24h < 0
        ? 'text-red-400'
        : 'text-slate-400'
    : 'text-slate-500';

  const volumeFormatted = opportunity.volume24h !== null
    ? opportunity.volume24h >= 1_000_000_000
      ? `$${(opportunity.volume24h / 1_000_000_000).toFixed(2)}B`
      : opportunity.volume24h >= 1_000_000
        ? `$${(opportunity.volume24h / 1_000_000).toFixed(2)}M`
        : `$${opportunity.volume24h.toLocaleString()}`
    : '-';

  const focusHref = currentViewId
    ? `/opportunities?viewId=${currentViewId}&assetId=${opportunity.id}`
    : `/opportunities?assetId=${opportunity.id}`;

  // Separate signals into categories
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

  const regularSignals = opportunity.signals.filter(
    (s) => !structureSignalIds.has(s.id) && !indicatorSignalIds.has(s.id)
  );
  const structureSignals = opportunity.signals.filter((s) =>
    structureSignalIds.has(s.id)
  );
  const indicatorSignals = opportunity.signals.filter((s) =>
    indicatorSignalIds.has(s.id)
  );

  // Check if we have any indicator data
  const hasIndicatorData = opportunity.indicators && (
    opportunity.indicators.rsi !== undefined ||
    opportunity.indicators.macd !== undefined ||
    opportunity.indicators.bollinger !== undefined ||
    opportunity.indicators.atr !== undefined
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-100">{opportunity.symbol}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
                  opportunity.kind === 'token'
                    ? 'bg-purple-900/50 text-purple-300'
                    : 'bg-cyan-900/50 text-cyan-300'
                }`}>
                  {opportunity.kind}
                </span>
              </div>
              <p className="text-slate-400 mt-1">{opportunity.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Opportunity Score */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 text-center">Opportunity Score</h3>
            <div className="flex justify-center mb-6">
              <ScoreBadge score={opportunity.score} size="large" />
            </div>
            <div className="space-y-3">
              <SubScoreBar label="Severity" score={opportunity.subScores.severity} />
              <SubScoreBar label="Signal Density" score={opportunity.subScores.signalDensity} />
              <SubScoreBar label="Price Momentum" score={opportunity.subScores.priceMomentum} />
              <SubScoreBar label="Volume" score={opportunity.subScores.volume} />
              <SubScoreBar label="Trend" score={opportunity.subScores.trend} />
              <SubScoreBar label="Preference Alignment" score={opportunity.subScores.preferenceAlignment} />
            </div>
          </div>

          {/* Why this score? */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Why this score?</h3>

            {/* Headline */}
            <div className="bg-slate-950 rounded-lg p-4 mb-4 border border-slate-700">
              <p className="text-slate-200 text-sm leading-relaxed">
                {opportunity.explanation.headline}
              </p>
            </div>

            {/* Factors */}
            <div className="space-y-3">
              {opportunity.explanation.factors.map((factor) => {
                const verdictColors = {
                  strong: 'text-green-400 bg-green-900/30 border-green-800',
                  neutral: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
                  weak: 'text-red-400 bg-red-900/30 border-red-800',
                };
                const verdictColor = verdictColors[factor.verdict];

                return (
                  <div
                    key={factor.key}
                    className="bg-slate-950 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-200">{factor.label}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded border capitalize ${verdictColor}`}
                      >
                        {factor.verdict}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Score: {factor.score}/100</span>
                      <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
                      <span>Contribution: {factor.contribution.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Price</p>
                <p className="text-lg font-semibold text-slate-100">{priceFormatted}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">24h Change</p>
                <p className={`text-lg font-semibold ${changeColor}`}>{changeFormatted}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">24h Volume</p>
                <p className="text-lg font-semibold text-slate-100">{volumeFormatted}</p>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Price Chart (24h)</h3>
            <OpportunityPriceChart assetId={opportunity.id} />
          </div>

          {/* Technical Indicators - Only show if we have indicator data */}
          {hasIndicatorData && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Technical Indicators</h3>
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-4">
                {/* RSI */}
                {opportunity.indicators?.rsi !== undefined && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                    <span className="text-sm text-slate-300 font-medium">RSI(14)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-slate-100">
                        {opportunity.indicators.rsi.toFixed(1)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        opportunity.indicators.rsi >= 70
                          ? 'bg-red-900/50 text-red-300'
                          : opportunity.indicators.rsi <= 30
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {opportunity.indicators.rsi >= 70
                          ? 'Overbought'
                          : opportunity.indicators.rsi <= 30
                            ? 'Oversold'
                            : 'Neutral'}
                      </span>
                    </div>
                  </div>
                )}

                {/* MACD */}
                {opportunity.indicators?.macd !== undefined && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                    <span className="text-sm text-slate-300 font-medium">MACD(12,26,9)</span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">
                          MACD: {opportunity.indicators.macd.macd.toFixed(3)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Signal: {opportunity.indicators.macd.signal.toFixed(3)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Hist: {opportunity.indicators.macd.hist.toFixed(3)}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        opportunity.indicators.macd.macd > opportunity.indicators.macd.signal
                          ? 'bg-green-900/50 text-green-300'
                          : opportunity.indicators.macd.macd < opportunity.indicators.macd.signal
                            ? 'bg-red-900/50 text-red-300'
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {opportunity.indicators.macd.macd > opportunity.indicators.macd.signal
                          ? 'Bullish'
                          : opportunity.indicators.macd.macd < opportunity.indicators.macd.signal
                            ? 'Bearish'
                            : 'Neutral'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bollinger Bands */}
                {opportunity.indicators?.bollinger !== undefined && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                    <span className="text-sm text-slate-300 font-medium">Bollinger(20,2)</span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">
                          Upper: ${opportunity.indicators.bollinger.upper.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Middle: ${opportunity.indicators.bollinger.middle.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Lower: ${opportunity.indicators.bollinger.lower.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Width: {opportunity.indicators.bollinger.bandwidth.toFixed(2)}%
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        opportunity.indicators.bollinger.bandwidth < 2
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : opportunity.indicators.bollinger.bandwidth > 5
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {opportunity.indicators.bollinger.bandwidth < 2
                          ? 'Squeeze'
                          : opportunity.indicators.bollinger.bandwidth > 5
                            ? 'Expanded'
                            : 'Normal'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ATR */}
                {opportunity.indicators?.atr !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-medium">ATR(14)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-slate-100">
                        {opportunity.indicators.atr.atrPercent.toFixed(2)}%
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        opportunity.indicators.atr.atrPercent >= 5
                          ? 'bg-red-900/50 text-red-300'
                          : opportunity.indicators.atr.atrPercent <= 2
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {opportunity.indicators.atr.atrPercent >= 5
                          ? 'High Volatility'
                          : opportunity.indicators.atr.atrPercent <= 2
                            ? 'Low Volatility'
                            : 'Normal'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signals */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Signals</h3>

            {/* Regular Signals */}
            {regularSignals.length > 0 ? (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3 mb-4">
                {regularSignals.map((signal) => (
                  <SignalBadge key={signal.id} signal={signal} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center mb-4">
                <p className="text-slate-500 text-sm">No regular signals detected</p>
              </div>
            )}

            {/* Structure-Based Signals (Price Action) - Only show if we have structure signals */}
            {structureSignals.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Price Action / ICT Signals
                </h4>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
                  {structureSignals.map((signal) => (
                    <SignalBadge key={signal.id} signal={signal} />
                  ))}
                </div>
              </div>
            )}

            {/* Indicator Signals - Only show if we have indicator signals */}
            {indicatorSignals.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Indicator Signals
                </h4>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
                  {indicatorSignals.map((signal) => (
                    <SignalBadge key={signal.id} signal={signal} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Watchlists */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Watchlists</h3>
            {opportunity.watchlists.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {opportunity.watchlists.map((wl) => (
                  <Link
                    key={wl.id}
                    href={`/watchlists/${wl.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors"
                  >
                    {wl.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center">
                <p className="text-slate-500 text-sm">Not in any watchlists</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/assets/${opportunity.id}`}
              className="flex-1 px-4 py-2 text-sm text-center bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              Open Asset Page
            </Link>
            <Link
              href={focusHref}
              className="flex-1 px-4 py-2 text-sm text-center bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
            >
              Focus This Asset
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// app/web/modules/signals/registry.ts

/**
 * Signal categories for grouping and filtering signals.
 */
export type SignalCategory =
  | 'momentum'
  | 'liquidity'
  | 'volatility'
  | 'structure'
  | 'other';

/**
 * Registry entry for a signal type, providing static metadata.
 * This is separate from the compute-time SignalDefinition which includes
 * the actual computation logic.
 */
export interface SignalRegistryEntry {
  /** Unique identifier for this signal type */
  key: string;
  /** Human-readable display name */
  label: string;
  /** Optional description of what this signal measures */
  description?: string;
  /** Default severity rank (0-3: none=0, info=1, watch=2, action=3) */
  defaultSeverity: number;
  /** Category for grouping signals */
  category: SignalCategory;
}

/**
 * Central registry of all known signal types and their metadata.
 * This is the source of truth for signal labels, categories, and default severities.
 */
export const SIGNAL_REGISTRY: Record<string, SignalRegistryEntry> = {
  // Volume/Liquidity signals
  volume_burst_1m: {
    key: 'volume_burst_1m',
    label: '1m Volume Burst',
    description:
      'Compares the last 1 minute of volume to a 1m baseline to detect sudden spikes.',
    defaultSeverity: 2,
    category: 'liquidity',
  },
  volume_burst_5m: {
    key: 'volume_burst_5m',
    label: '5m Volume Burst',
    description:
      'Compares the last 5 minutes of volume to a 5m baseline to detect sustained spikes.',
    defaultSeverity: 2,
    category: 'liquidity',
  },
  volume_burst: {
    key: 'volume_burst',
    label: 'Volume Burst',
    description: 'Generic volume burst signal for detecting abnormal volume.',
    defaultSeverity: 2,
    category: 'liquidity',
  },

  // Momentum signals
  price_spike: {
    key: 'price_spike',
    label: 'Price Spike',
    description: 'Detects sudden price movements beyond normal volatility.',
    defaultSeverity: 2,
    category: 'momentum',
  },
  price_move: {
    key: 'price_move',
    label: 'Price Move',
    description: 'Tracks significant directional price movements.',
    defaultSeverity: 1,
    category: 'momentum',
  },

  // Volatility signals (placeholders for future)
  volatility_compression: {
    key: 'volatility_compression',
    label: 'Volatility Compression',
    description: 'Detects periods of unusually low volatility before breakouts.',
    defaultSeverity: 1,
    category: 'volatility',
  },

  // Structure signals (placeholders for future)
  vwap_deviation: {
    key: 'vwap_deviation',
    label: 'VWAP Deviation',
    description: 'Measures deviation from volume-weighted average price.',
    defaultSeverity: 1,
    category: 'structure',
  },

  // Price Action / ICT Structure Signals (Milestone 33)
  trendline_break_up: {
    key: 'trendline_break_up',
    label: 'Trendline Break (Up)',
    description: 'Price breaks above a downtrend trendline.',
    defaultSeverity: 2,
    category: 'structure',
  },
  trendline_break_down: {
    key: 'trendline_break_down',
    label: 'Trendline Break (Down)',
    description: 'Price breaks below an uptrend trendline.',
    defaultSeverity: 2,
    category: 'structure',
  },
  trendline_break_retest: {
    key: 'trendline_break_retest',
    label: 'Trendline Break & Retest',
    description: 'Price breaks trendline and successfully retests it.',
    defaultSeverity: 3,
    category: 'structure',
  },
  support_break: {
    key: 'support_break',
    label: 'Support Break',
    description: 'Price breaks below a support level.',
    defaultSeverity: 2,
    category: 'structure',
  },
  resistance_break: {
    key: 'resistance_break',
    label: 'Resistance Break',
    description: 'Price breaks above a resistance level.',
    defaultSeverity: 2,
    category: 'structure',
  },
  support_flip: {
    key: 'support_flip',
    label: 'Support Flip',
    description: 'Support becomes resistance after break and retest.',
    defaultSeverity: 3,
    category: 'structure',
  },
  resistance_flip: {
    key: 'resistance_flip',
    label: 'Resistance Flip',
    description: 'Resistance becomes support after break and retest.',
    defaultSeverity: 3,
    category: 'structure',
  },
  liquidity_sweep_up: {
    key: 'liquidity_sweep_up',
    label: 'Liquidity Sweep (Up)',
    description: 'Price sweeps above equal lows then reverses.',
    defaultSeverity: 3,
    category: 'structure',
  },
  liquidity_sweep_down: {
    key: 'liquidity_sweep_down',
    label: 'Liquidity Sweep (Down)',
    description: 'Price sweeps below equal highs then reverses.',
    defaultSeverity: 3,
    category: 'structure',
  },
  fvg_bullish: {
    key: 'fvg_bullish',
    label: 'Bullish Fair Value Gap',
    description: 'Bullish FVG detected (3-candle gap structure).',
    defaultSeverity: 1,
    category: 'structure',
  },
  fvg_bearish: {
    key: 'fvg_bearish',
    label: 'Bearish Fair Value Gap',
    description: 'Bearish FVG detected (3-candle gap structure).',
    defaultSeverity: 1,
    category: 'structure',
  },
  discount_retrace: {
    key: 'discount_retrace',
    label: 'Fibonacci Discount Zone',
    description: 'Price is in Fibonacci discount zone (21-38%).',
    defaultSeverity: 1,
    category: 'structure',
  },
  premium_retrace: {
    key: 'premium_retrace',
    label: 'Fibonacci Premium Zone',
    description: 'Price is in Fibonacci premium zone (62-79%).',
    defaultSeverity: 1,
    category: 'structure',
  },

  // Technical Indicator Signals (Milestone 34)
  rsi_overbought: {
    key: 'rsi_overbought',
    label: 'RSI Overbought',
    description: 'RSI >= 70, indicating overbought conditions.',
    defaultSeverity: 2,
    category: 'momentum',
  },
  rsi_oversold: {
    key: 'rsi_oversold',
    label: 'RSI Oversold',
    description: 'RSI <= 30, indicating oversold conditions.',
    defaultSeverity: 2,
    category: 'momentum',
  },
  macd_bull_cross: {
    key: 'macd_bull_cross',
    label: 'MACD Bullish Cross',
    description: 'MACD line crosses above signal line.',
    defaultSeverity: 3,
    category: 'momentum',
  },
  macd_bear_cross: {
    key: 'macd_bear_cross',
    label: 'MACD Bearish Cross',
    description: 'MACD line crosses below signal line.',
    defaultSeverity: 3,
    category: 'momentum',
  },
  macd_histogram_expand: {
    key: 'macd_histogram_expand',
    label: 'MACD Histogram Expanding',
    description: 'MACD histogram growing, indicating momentum acceleration.',
    defaultSeverity: 1,
    category: 'momentum',
  },
  bb_squeeze: {
    key: 'bb_squeeze',
    label: 'Bollinger Squeeze',
    description: 'Bollinger Bands contracting, suggesting breakout potential.',
    defaultSeverity: 2,
    category: 'volatility',
  },
  bb_expand: {
    key: 'bb_expand',
    label: 'Bollinger Expansion',
    description: 'Bollinger Bands expanding, indicating increased volatility.',
    defaultSeverity: 1,
    category: 'volatility',
  },
  bb_tag_upper: {
    key: 'bb_tag_upper',
    label: 'Bollinger Upper Tag',
    description: 'Price touching upper Bollinger Band.',
    defaultSeverity: 2,
    category: 'volatility',
  },
  bb_tag_lower: {
    key: 'bb_tag_lower',
    label: 'Bollinger Lower Tag',
    description: 'Price touching lower Bollinger Band.',
    defaultSeverity: 2,
    category: 'volatility',
  },
  atr_spike: {
    key: 'atr_spike',
    label: 'ATR Spike (High Volatility)',
    description: 'ATR in top 20%, indicating high volatility.',
    defaultSeverity: 1,
    category: 'volatility',
  },
  atr_crush: {
    key: 'atr_crush',
    label: 'ATR Crush (Low Volatility)',
    description: 'ATR in bottom 20%, indicating low volatility.',
    defaultSeverity: 1,
    category: 'volatility',
  },
};

/**
 * Get the registry entry for a signal by key.
 * Returns null if the signal is not registered.
 */
export function getSignalDefinition(key: string): SignalRegistryEntry | null {
  return SIGNAL_REGISTRY[key] ?? null;
}

/**
 * Get all registered signal definitions as an array.
 */
export function listSignalDefinitions(): SignalRegistryEntry[] {
  return Object.values(SIGNAL_REGISTRY);
}

/**
 * Get all signals in a specific category.
 */
export function getSignalsByCategory(
  category: SignalCategory
): SignalRegistryEntry[] {
  return listSignalDefinitions().filter((s) => s.category === category);
}

/**
 * Get the label for a signal key, with fallback.
 * Useful when displaying signal names in UI.
 */
export function getSignalLabel(key: string): string {
  const entry = getSignalDefinition(key);
  return entry?.label ?? key;
}

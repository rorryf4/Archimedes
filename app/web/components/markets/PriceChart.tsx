'use client';

import { useState } from 'react';
import type { CandlePoint } from '@/modules/markets/candles';

interface PriceChartProps {
  data: CandlePoint[];
  rangeLabel?: string;
  size?: 'default' | 'compact';
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(4)}`;
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PriceChart({ data, rangeLabel = '24h', size = 'default' }: PriceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-slate-400 text-lg">No price data available.</p>
        <p className="text-slate-500 text-sm mt-1">
          Price history will appear here when data is available.
        </p>
      </div>
    );
  }

  // Chart dimensions based on size
  const width = 800;
  const height = size === 'compact' ? 200 : 400;
  const padding = { top: 20, right: 60, bottom: size === 'compact' ? 60 : 100, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const priceChartHeight = size === 'compact' ? 120 : 240;
  const volumeChartHeight = size === 'compact' ? 40 : 80;
  const gap = 10;

  // Calculate price range
  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  const pricePadding = priceRange * 0.1;
  const yMin = minPrice - pricePadding;
  const yMax = maxPrice + pricePadding;
  const yRange = yMax - yMin;

  // Calculate volume range (if volume data exists)
  const volumes = data.map((d) => d.volume ?? 0).filter((v) => v > 0);
  const hasVolume = volumes.length > 0;
  const maxVolume = hasVolume ? Math.max(...volumes) : 1;

  // Calculate candle width
  const candleWidth = Math.max(2, chartWidth / data.length - 2);
  const candleSpacing = chartWidth / data.length;

  // Helper to get y coordinate for price
  const getPriceY = (price: number) => {
    return padding.top + priceChartHeight - ((price - yMin) / yRange) * priceChartHeight;
  };

  // Helper to get candle color
  const getCandleColor = (candle: CandlePoint) => {
    if (candle.close > candle.open) {
      return { fill: '#22c55e', stroke: '#16a34a' }; // green-500 / green-600
    } else if (candle.close < candle.open) {
      return { fill: '#ef4444', stroke: '#dc2626' }; // red-500 / red-600
    } else {
      return { fill: '#64748b', stroke: '#475569' }; // slate-500 / slate-600
    }
  };

  // Generate EMA line points
  const emaShortPoints = data
    .map((candle, index) => {
      if (candle.emaShort === null || candle.emaShort === undefined) return null;
      const x = padding.left + index * candleSpacing + candleSpacing / 2;
      const y = getPriceY(candle.emaShort);
      return `${x},${y}`;
    })
    .filter((p): p is string => p !== null)
    .join(' ');

  const emaLongPoints = data
    .map((candle, index) => {
      if (candle.emaLong === null || candle.emaLong === undefined) return null;
      const x = padding.left + index * candleSpacing + candleSpacing / 2;
      const y = getPriceY(candle.emaLong);
      return `${x},${y}`;
    })
    .filter((p): p is string => p !== null)
    .join(' ');

  // Y-axis labels for price
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const price = yMin + (yRange * (4 - i)) / 4;
    const y = getPriceY(price);
    return { price, y };
  });

  // X-axis labels (show every ~10th candle or fewer for compact)
  const labelInterval = size === 'compact' ? Math.ceil(data.length / 4) : Math.ceil(data.length / 8);
  const xLabels = data
    .map((candle, index) => {
      if (index % labelInterval === 0 || index === data.length - 1) {
        return {
          timestamp: candle.timestamp,
          x: padding.left + index * candleSpacing + candleSpacing / 2,
        };
      }
      return null;
    })
    .filter((l): l is { timestamp: number; x: number } => l !== null);

  // Hovered candle data
  const hoveredCandle = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-lg py-6 px-4 ${size === 'compact' ? 'min-h-[200px]' : ''}`}>
      {/* Tooltip - Fixed to top of chart area to stay within bounds */}
      {hoveredCandle && (
        <div className="mb-2 p-3 bg-slate-900 rounded border border-slate-700 text-sm max-w-full overflow-hidden">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-slate-400">Time:</div>
            <div className="text-slate-200 truncate">{formatDateTime(hoveredCandle.timestamp)}</div>
            <div className="text-slate-400">Open:</div>
            <div className="text-slate-200">{formatPrice(hoveredCandle.open)}</div>
            <div className="text-slate-400">High:</div>
            <div className="text-slate-200">{formatPrice(hoveredCandle.high)}</div>
            <div className="text-slate-400">Low:</div>
            <div className="text-slate-200">{formatPrice(hoveredCandle.low)}</div>
            <div className="text-slate-400">Close:</div>
            <div className="text-slate-200">{formatPrice(hoveredCandle.close)}</div>
            {hoveredCandle.emaShort !== null && hoveredCandle.emaShort !== undefined && (
              <>
                <div className="text-slate-400">EMA (12):</div>
                <div className="text-blue-400">{formatPrice(hoveredCandle.emaShort)}</div>
              </>
            )}
            {hoveredCandle.emaLong !== null && hoveredCandle.emaLong !== undefined && (
              <>
                <div className="text-slate-400">EMA (26):</div>
                <div className="text-purple-400">{formatPrice(hoveredCandle.emaLong)}</div>
              </>
            )}
            {hoveredCandle.volume !== null && hoveredCandle.volume !== undefined && (
              <>
                <div className="text-slate-400">Volume:</div>
                <div className="text-slate-200">
                  {hoveredCandle.volume >= 1_000_000
                    ? `$${(hoveredCandle.volume / 1_000_000).toFixed(2)}M`
                    : `$${hoveredCandle.volume.toLocaleString()}`}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines for price chart */}
        {yLabels.map((label, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={label.y}
            x2={padding.left + chartWidth}
            y2={label.y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* EMA Short (12) - blue */}
        {emaShortPoints && (
          <polyline
            points={emaShortPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            opacity="0.8"
          />
        )}

        {/* EMA Long (26) - purple */}
        {emaLongPoints && (
          <polyline
            points={emaLongPoints}
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.5"
            opacity="0.8"
          />
        )}

        {/* Candlesticks */}
        {data.map((candle, index) => {
          const x = padding.left + index * candleSpacing + candleSpacing / 2;
          const { fill, stroke } = getCandleColor(candle);

          const highY = getPriceY(candle.high);
          const lowY = getPriceY(candle.low);
          const openY = getPriceY(candle.open);
          const closeY = getPriceY(candle.close);

          const bodyTop = Math.min(openY, closeY);
          const bodyBottom = Math.max(openY, closeY);
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

          return (
            <g key={`candle-${index}`}>
              {/* Wick (high-low line) */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={stroke}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
              />
              {/* Hover area */}
              <rect
                x={x - candleSpacing / 2}
                y={padding.top}
                width={candleSpacing}
                height={priceChartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          );
        })}

        {/* Volume bars (if available) */}
        {hasVolume && (
          <g>
            {data.map((candle, index) => {
              const volume = candle.volume ?? 0;
              if (volume === 0) return null;

              const x = padding.left + index * candleSpacing + candleSpacing / 2;
              const volumeBarHeight = (volume / maxVolume) * volumeChartHeight;
              const volumeY = padding.top + priceChartHeight + gap + volumeChartHeight - volumeBarHeight;

              const isUp = candle.close >= candle.open;
              const volumeColor = isUp ? '#22c55e' : '#ef4444';

              return (
                <rect
                  key={`volume-${index}`}
                  x={x - candleWidth / 2}
                  y={volumeY}
                  width={candleWidth}
                  height={volumeBarHeight}
                  fill={volumeColor}
                  opacity="0.5"
                />
              );
            })}
          </g>
        )}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <text
            key={`ylabel-${i}`}
            x={padding.left + chartWidth + 8}
            y={label.y + 4}
            fill="#94a3b8"
            fontSize="12"
            textAnchor="start"
          >
            {formatPrice(label.price)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={`xlabel-${i}`}
            x={label.x}
            y={height - 10}
            fill="#94a3b8"
            fontSize="12"
            textAnchor="middle"
          >
            {formatTime(label.timestamp)}
          </text>
        ))}

        {/* Legend */}
        <g transform={`translate(${padding.left}, ${height - padding.bottom + 20})`}>
          <text x="0" y="0" fill="#94a3b8" fontSize="11">
            <tspan fill="#22c55e">■</tspan> Up
          </text>
          <text x="50" y="0" fill="#94a3b8" fontSize="11">
            <tspan fill="#ef4444">■</tspan> Down
          </text>
          <text x="110" y="0" fill="#94a3b8" fontSize="11">
            <tspan fill="#3b82f6">—</tspan> EMA(12)
          </text>
          <text x="190" y="0" fill="#94a3b8" fontSize="11">
            <tspan fill="#a855f7">—</tspan> EMA(26)
          </text>
        </g>
      </svg>
    </div>
  );
}

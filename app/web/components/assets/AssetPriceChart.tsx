'use client';

import type { PricePoint } from '@/modules/markets/history';

interface AssetPriceChartProps {
  data: PricePoint[];
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

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function AssetPriceChart({ data }: AssetPriceChartProps) {
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

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate price range
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
  const pricePadding = priceRange * 0.1;
  const yMin = minPrice - pricePadding;
  const yMax = maxPrice + pricePadding;
  const yRange = yMax - yMin;

  // Generate polyline points
  const points = data
    .map((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - yMin) / yRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Generate area fill path
  const areaPath = `
    M ${padding.left},${padding.top + chartHeight}
    L ${data
      .map((point, index) => {
        const x = padding.left + (index / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.price - yMin) / yRange) * chartHeight;
        return `${x},${y}`;
      })
      .join(' L ')}
    L ${padding.left + chartWidth},${padding.top + chartHeight}
    Z
  `;

  // Determine trend color
  const startPrice = data[0].price;
  const endPrice = data[data.length - 1].price;
  const isPositive = endPrice >= startPrice;
  const lineColor = isPositive ? '#4ade80' : '#f87171'; // green-400 / red-400
  const fillColor = isPositive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)';

  // Y-axis labels (5 labels)
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const price = yMin + (yRange * (4 - i)) / 4;
    const y = padding.top + (chartHeight * i) / 4;
    return { price, y };
  });

  // X-axis labels (show first, middle, last timestamps)
  const xLabels = [
    { timestamp: data[0].timestamp, x: padding.left },
    { timestamp: data[Math.floor(data.length / 2)].timestamp, x: padding.left + chartWidth / 2 },
    { timestamp: data[data.length - 1].timestamp, x: padding.left + chartWidth },
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={padding.left + chartWidth}
            y2={label.y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Price line */}
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" />

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <text
            key={i}
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
            key={i}
            x={label.x}
            y={height - 10}
            fill="#94a3b8"
            fontSize="12"
            textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
          >
            {formatTime(label.timestamp)}
          </text>
        ))}
      </svg>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { PriceChart } from '@/components/markets/PriceChart';
import type { CandlePoint } from '@/modules/markets/candles';

interface OpportunityPriceChartProps {
  assetId: string;
}

export function OpportunityPriceChart({ assetId }: OpportunityPriceChartProps) {
  const [candleData, setCandleData] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Dynamically import to avoid server-side execution
        const { getCandlestickData } = await import('@/modules/markets/candles');
        const data = await getCandlestickData(assetId);
        setCandleData(data);
      } catch (error) {
        console.error('Failed to load candlestick data:', error);
        setCandleData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assetId]);

  if (loading) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-3">Loading chart...</p>
      </div>
    );
  }

  return <PriceChart data={candleData} rangeLabel="24h" size="compact" />;
}

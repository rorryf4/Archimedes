import { SEVERITY_META, type SignalCatalogEntry } from '@/modules/signals/catalog';
import type { SignalSeverity } from '@/modules/signals/types';

interface OpportunitiesFiltersProps {
  currentMinSeverity: SignalSeverity;
  currentSignalKeys: string[];
  currentWatchlistId: string;
  currentSortBy: string;
  watchlists: { id: string; name: string }[];
  signalCatalog: SignalCatalogEntry[];
  currentStructureFilters?: {
    trendlineBreak?: boolean;
    breakRetest?: boolean;
    srBreak?: boolean;
    srFlip?: boolean;
    liquiditySweep?: boolean;
    fvg?: boolean;
    fibDiscount?: boolean;
    fibPremium?: boolean;
  };
  currentIndicatorFilters?: {
    rsiOverbought?: boolean;
    rsiOversold?: boolean;
    macdBullCross?: boolean;
    macdBearCross?: boolean;
    bbSqueeze?: boolean;
    bbTagUpper?: boolean;
    bbTagLower?: boolean;
    atrSpike?: boolean;
    atrCrush?: boolean;
  };
}

const SEVERITY_OPTIONS: SignalSeverity[] = ['info', 'watch', 'action'];

const SORT_OPTIONS = [
  { value: 'score', label: 'Score (High → Low)' },
  { value: 'severity', label: 'Severity (High → Low)' },
  { value: 'priceChange', label: 'Price Change (High → Low)' },
];

export function OpportunitiesFilters({
  currentMinSeverity,
  currentSignalKeys,
  currentWatchlistId,
  currentSortBy,
  watchlists,
  signalCatalog,
  currentStructureFilters = {},
  currentIndicatorFilters = {},
}: OpportunitiesFiltersProps) {
  return (
    <form
      action="/opportunities"
      method="get"
      className="bg-slate-800 rounded-lg border border-slate-700 p-4"
    >
      <div className="space-y-4">
        {/* Top Row: Sort, Severity, Watchlist, and Signal Types */}
        <div className="flex flex-wrap gap-6 items-end">
          {/* Sort By */}
          <div className="flex flex-col gap-1">
            <label htmlFor="sortBy" className="text-sm text-slate-400">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              defaultValue={currentSortBy}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min Severity */}
          <div className="flex flex-col gap-1">
            <label htmlFor="minSeverity" className="text-sm text-slate-400">
              Min Severity
            </label>
            <select
              id="minSeverity"
              name="minSeverity"
              defaultValue={currentMinSeverity}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITY_OPTIONS.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_META[severity].label}
                </option>
              ))}
            </select>
          </div>

          {/* Watchlist */}
          <div className="flex flex-col gap-1">
            <label htmlFor="watchlistId" className="text-sm text-slate-400">
              Watchlist
            </label>
            <select
              id="watchlistId"
              name="watchlistId"
              defaultValue={currentWatchlistId}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All watchlists</option>
              {watchlists.map((wl) => (
                <option key={wl.id} value={wl.id}>
                  {wl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Signal Types */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">Signal Types</span>
            <div className="flex flex-wrap gap-3">
              {signalCatalog.map((signal) => (
                <label
                  key={signal.id}
                  className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap"
                >
                  <input
                    type="checkbox"
                    name="signals"
                    value={signal.id}
                    defaultChecked={currentSignalKeys.includes(signal.id)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
                  />
                  {signal.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-700"></div>

        {/* Price Action Filters (ICT) */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-400">Price Action Filters (ICT)</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_trendlineBreak"
                value="true"
                defaultChecked={currentStructureFilters.trendlineBreak ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Trendline Break
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_breakRetest"
                value="true"
                defaultChecked={currentStructureFilters.breakRetest ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Break & Retest
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_srBreak"
                value="true"
                defaultChecked={currentStructureFilters.srBreak ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              S/R Break
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_srFlip"
                value="true"
                defaultChecked={currentStructureFilters.srFlip ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              S/R Flip
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_liquiditySweep"
                value="true"
                defaultChecked={currentStructureFilters.liquiditySweep ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Liquidity Sweep
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_fvg"
                value="true"
                defaultChecked={currentStructureFilters.fvg ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Fair Value Gap
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_fibDiscount"
                value="true"
                defaultChecked={currentStructureFilters.fibDiscount ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Fib Discount
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="structureFilter_fibPremium"
                value="true"
                defaultChecked={currentStructureFilters.fibPremium ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              Fib Premium
            </label>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-700"></div>

        {/* Indicator Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-400">Indicator Filters</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_rsiOverbought"
                value="true"
                defaultChecked={currentIndicatorFilters.rsiOverbought ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              RSI Overbought
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_rsiOversold"
                value="true"
                defaultChecked={currentIndicatorFilters.rsiOversold ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              RSI Oversold
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_macdBullCross"
                value="true"
                defaultChecked={currentIndicatorFilters.macdBullCross ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              MACD Bull Cross
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_macdBearCross"
                value="true"
                defaultChecked={currentIndicatorFilters.macdBearCross ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              MACD Bear Cross
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_bbSqueeze"
                value="true"
                defaultChecked={currentIndicatorFilters.bbSqueeze ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              BB Squeeze
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_bbTagUpper"
                value="true"
                defaultChecked={currentIndicatorFilters.bbTagUpper ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              BB Upper Tag
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_bbTagLower"
                value="true"
                defaultChecked={currentIndicatorFilters.bbTagLower ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              BB Lower Tag
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_atrSpike"
                value="true"
                defaultChecked={currentIndicatorFilters.atrSpike ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              ATR Spike
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                name="indicatorFilter_atrCrush"
                value="true"
                defaultChecked={currentIndicatorFilters.atrCrush ?? false}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 flex-shrink-0"
              />
              ATR Crush
            </label>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-700"></div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </form>
  );
}

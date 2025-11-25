import { listOpportunities } from '@/modules/opportunities/service';
import { listSavedOpportunityViewsForCurrentUser, getSavedOpportunityViewForCurrentUser } from '@/modules/opportunities/savedViews.service';
import { getCurrentUserSignalPreferences } from '@/modules/signals/preferences.service';
import { listWatchlists } from '@/modules/watchlists/service';
import { getSignalCatalog } from '@/modules/signals/catalog';
import type { SignalSeverity } from '@/modules/signals/types';
import { OpportunitiesTable } from '@/components/opportunities/OpportunitiesTable';
import { OpportunitiesFilters } from '@/components/opportunities/OpportunitiesFilters';
import { SavedViewsList } from '@/components/opportunities/SavedViewsList';
import { OpportunitiesHeader } from '@/components/opportunities/OpportunitiesHeader';

const VALID_SEVERITIES: SignalSeverity[] = ['none', 'info', 'watch', 'action'];
const DEFAULT_MIN_SEVERITY: SignalSeverity = 'info';
const VALID_SORT_OPTIONS = ['score', 'severity', 'priceChange'] as const;
const DEFAULT_SORT = 'score';

type SortOption = typeof VALID_SORT_OPTIONS[number];

interface PageProps {
  searchParams: Promise<{
    minSeverity?: string | string[];
    signals?: string | string[];
    watchlistId?: string | string[];
    assetId?: string | string[];
    viewId?: string | string[];
    sortBy?: string | string[];
    structureFilter_trendlineBreak?: string | string[];
    structureFilter_breakRetest?: string | string[];
    structureFilter_srBreak?: string | string[];
    structureFilter_srFlip?: string | string[];
    structureFilter_liquiditySweep?: string | string[];
    structureFilter_fvg?: string | string[];
    structureFilter_fibDiscount?: string | string[];
    structureFilter_fibPremium?: string | string[];
    indicatorFilter_rsiOverbought?: string | string[];
    indicatorFilter_rsiOversold?: string | string[];
    indicatorFilter_macdBullCross?: string | string[];
    indicatorFilter_macdBearCross?: string | string[];
    indicatorFilter_bbSqueeze?: string | string[];
    indicatorFilter_bbTagUpper?: string | string[];
    indicatorFilter_bbTagLower?: string | string[];
    indicatorFilter_atrSpike?: string | string[];
    indicatorFilter_atrCrush?: string | string[];
  }>;
}

function parseMinSeverity(value: string | string[] | undefined): SignalSeverity {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && VALID_SEVERITIES.includes(raw as SignalSeverity)) {
    return raw as SignalSeverity;
  }
  return DEFAULT_MIN_SEVERITY;
}

function parseSortBy(value: string | string[] | undefined): SortOption {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && VALID_SORT_OPTIONS.includes(raw as SortOption)) {
    return raw as SortOption;
  }
  return DEFAULT_SORT;
}

function parseSignalKeys(value: string | string[] | undefined): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    // Handle ?signals=a&signals=b
    return value.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));
  }

  // Handle ?signals=a,b
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

function parseStructureFilters(params: {
  structureFilter_trendlineBreak?: string | string[];
  structureFilter_breakRetest?: string | string[];
  structureFilter_srBreak?: string | string[];
  structureFilter_srFlip?: string | string[];
  structureFilter_liquiditySweep?: string | string[];
  structureFilter_fvg?: string | string[];
  structureFilter_fibDiscount?: string | string[];
  structureFilter_fibPremium?: string | string[];
}) {
  const parseBoolean = (value: string | string[] | undefined): boolean => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === 'true';
  };

  const filters = {
    trendlineBreak: parseBoolean(params.structureFilter_trendlineBreak),
    breakRetest: parseBoolean(params.structureFilter_breakRetest),
    srBreak: parseBoolean(params.structureFilter_srBreak),
    srFlip: parseBoolean(params.structureFilter_srFlip),
    liquiditySweep: parseBoolean(params.structureFilter_liquiditySweep),
    fvg: parseBoolean(params.structureFilter_fvg),
    fibDiscount: parseBoolean(params.structureFilter_fibDiscount),
    fibPremium: parseBoolean(params.structureFilter_fibPremium),
  };

  // Only return filters if at least one is enabled
  const hasAnyEnabled = Object.values(filters).some(Boolean);
  return hasAnyEnabled ? filters : undefined;
}

function parseIndicatorFilters(params: {
  indicatorFilter_rsiOverbought?: string | string[];
  indicatorFilter_rsiOversold?: string | string[];
  indicatorFilter_macdBullCross?: string | string[];
  indicatorFilter_macdBearCross?: string | string[];
  indicatorFilter_bbSqueeze?: string | string[];
  indicatorFilter_bbTagUpper?: string | string[];
  indicatorFilter_bbTagLower?: string | string[];
  indicatorFilter_atrSpike?: string | string[];
  indicatorFilter_atrCrush?: string | string[];
}) {
  const parseBoolean = (value: string | string[] | undefined): boolean => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === 'true';
  };

  const filters = {
    rsiOverbought: parseBoolean(params.indicatorFilter_rsiOverbought),
    rsiOversold: parseBoolean(params.indicatorFilter_rsiOversold),
    macdBullCross: parseBoolean(params.indicatorFilter_macdBullCross),
    macdBearCross: parseBoolean(params.indicatorFilter_macdBearCross),
    bbSqueeze: parseBoolean(params.indicatorFilter_bbSqueeze),
    bbTagUpper: parseBoolean(params.indicatorFilter_bbTagUpper),
    bbTagLower: parseBoolean(params.indicatorFilter_bbTagLower),
    atrSpike: parseBoolean(params.indicatorFilter_atrSpike),
    atrCrush: parseBoolean(params.indicatorFilter_atrCrush),
  };

  // Only return filters if at least one is enabled
  const hasAnyEnabled = Object.values(filters).some(Boolean);
  return hasAnyEnabled ? filters : undefined;
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse viewId first - if present, load the saved view
  const viewId = parseViewId(params.viewId);
  let savedView = null;

  if (viewId) {
    savedView = await getSavedOpportunityViewForCurrentUser(viewId);
  }

  // Parse query params, with saved view as fallback
  const minSeverity = savedView
    ? savedView.params.minSeverity
    : parseMinSeverity(params.minSeverity);

  const signalKeys = savedView
    ? savedView.params.signalKeys
    : parseSignalKeys(params.signals);

  const watchlistId = savedView
    ? (savedView.params.watchlistId || '')
    : parseWatchlistId(params.watchlistId);

  const structureFilters = savedView
    ? savedView.params.structureFilters
    : parseStructureFilters(params);

  const indicatorFilters = savedView
    ? savedView.params.indicatorFilters
    : parseIndicatorFilters(params);

  // Parse assetId (not part of saved view, always from query string)
  const assetId = parseAssetId(params.assetId);

  // Parse sortBy (always from query string, defaults to 'score')
  const sortBy = parseSortBy(params.sortBy);

  // Fetch data
  const opportunities = await listOpportunities({
    minSeverity,
    signalKeys: signalKeys.length > 0 ? signalKeys : undefined,
    watchlistId: watchlistId || undefined,
    assetId: assetId || undefined,
    sortBy,
    structureFilters,
    indicatorFilters,
  });

  const savedViews = await listSavedOpportunityViewsForCurrentUser();
  const signalPreferences = await getCurrentUserSignalPreferences();
  const watchlists = listWatchlists();
  const signalCatalog = getSignalCatalog();

  // Map watchlists to simple { id, name } for filters
  const watchlistOptions = watchlists.map((wl) => ({
    id: wl.id,
    name: wl.name,
  }));

  // Build current params for SaveCurrentViewButton
  const currentParams = {
    minSeverity,
    signalKeys,
    watchlistId: watchlistId || null,
    structureFilters,
    indicatorFilters,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Opportunities</h1>
          <p className="text-slate-400 mt-1">
            {assetId
              ? 'Filtered to a specific asset'
              : viewId && savedView
                ? `Viewing: ${savedView.name}`
                : 'Ranked by signal severity across all watchlists'}
          </p>
        </div>
        <OpportunitiesHeader
          currentParams={currentParams}
          signalCatalog={signalCatalog}
          currentPreferences={signalPreferences}
        />
      </div>

      {/* Saved Views */}
      <SavedViewsList savedViews={savedViews} currentViewId={viewId} />

      {/* Filters */}
      <OpportunitiesFilters
        currentMinSeverity={minSeverity}
        currentSignalKeys={signalKeys}
        currentWatchlistId={watchlistId}
        currentSortBy={sortBy}
        watchlists={watchlistOptions}
        signalCatalog={signalCatalog}
        currentStructureFilters={structureFilters}
        currentIndicatorFilters={indicatorFilters}
      />

      {/* Content */}
      {opportunities.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <p className="text-slate-400">
            No opportunities found. {assetId ? 'Try adjusting your filters or select a different asset.' : 'Add items to your watchlists to see signal-based opportunities.'}
          </p>
        </div>
      ) : (
        <OpportunitiesTable opportunities={opportunities} currentViewId={viewId} />
      )}
    </div>
  );
}

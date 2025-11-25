import type { SignalSeverity } from '../signals/types';

export interface SavedOpportunityViewParams {
  minSeverity: SignalSeverity;
  signalKeys: string[];
  watchlistId: string | null;
  structureFilters?: {
    trendlineBreak?: boolean;
    breakRetest?: boolean;
    srBreak?: boolean;
    srFlip?: boolean;
    liquiditySweep?: boolean;
    fvg?: boolean;
    fibDiscount?: boolean;
    fibPremium?: boolean;
  };
  indicatorFilters?: {
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

export interface SavedOpportunityView {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  params: SavedOpportunityViewParams;
}

export interface CreateSavedOpportunityViewInput {
  name: string;
  params: SavedOpportunityViewParams;
}

export interface UpdateSavedOpportunityViewInput {
  name?: string;
  params?: Partial<SavedOpportunityViewParams>;
}

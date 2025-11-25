'use client';

import { useState } from 'react';
import { SaveCurrentViewButton } from './SaveCurrentViewButton';
import { SignalSettingsModal } from './SignalSettingsModal';
import type { SavedOpportunityViewParams } from '@/modules/opportunities/savedViews.types';
import type { SignalCatalogEntry } from '@/modules/signals/catalog';
import type { UserSignalPreferences } from '@/modules/signals/preferences.types';

interface OpportunitiesHeaderProps {
  currentParams: SavedOpportunityViewParams;
  signalCatalog: SignalCatalogEntry[];
  currentPreferences: UserSignalPreferences | null;
}

export function OpportunitiesHeader({
  currentParams,
  signalCatalog,
  currentPreferences,
}: OpportunitiesHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
        >
          Signal Settings
        </button>
        <SaveCurrentViewButton currentParams={currentParams} />
      </div>

      <SignalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        signalCatalog={signalCatalog}
        currentPreferences={currentPreferences}
      />
    </>
  );
}

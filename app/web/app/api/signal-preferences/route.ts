import { NextResponse } from 'next/server';
import {
  getCurrentUserSignalPreferences,
  updateCurrentUserSignalPreferences,
} from '@/modules/signals/preferences.service';
import type { UpdateUserSignalPreferencesInput } from '@/modules/signals/preferences.types';

export async function GET() {
  try {
    const preferences = await getCurrentUserSignalPreferences();
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching signal preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: UpdateUserSignalPreferencesInput = {
      defaultMinSeverity: body.defaultMinSeverity,
      signalPreferences: body.signalPreferences,
    };

    const updated = await updateCurrentUserSignalPreferences(input);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating signal preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update signal preferences' },
      { status: 500 }
    );
  }
}

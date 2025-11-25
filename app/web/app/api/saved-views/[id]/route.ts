import { NextResponse } from 'next/server';
import {
  getSavedOpportunityViewForCurrentUser,
  updateSavedOpportunityViewForCurrentUser,
  deleteSavedOpportunityViewForCurrentUser,
} from '@/modules/opportunities/savedViews.service';
import type { UpdateSavedOpportunityViewInput } from '@/modules/opportunities/savedViews.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const view = await getSavedOpportunityViewForCurrentUser(id);

  if (!view) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(view);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UpdateSavedOpportunityViewInput;

  const updated = await updateSavedOpportunityViewForCurrentUser(id, body);

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const deleted = await deleteSavedOpportunityViewForCurrentUser(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

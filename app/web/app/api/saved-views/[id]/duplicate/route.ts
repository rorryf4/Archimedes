import { NextResponse } from 'next/server';
import { duplicateSavedOpportunityViewForCurrentUser } from '@/modules/opportunities/savedViews.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const duplicated = await duplicateSavedOpportunityViewForCurrentUser(id);

  if (!duplicated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(duplicated, { status: 201 });
}

import { NextResponse } from 'next/server';
import {
  listSavedOpportunityViewsForCurrentUser,
  createSavedOpportunityViewForCurrentUser,
} from '@/modules/opportunities/savedViews.service';
import type { CreateSavedOpportunityViewInput } from '@/modules/opportunities/savedViews.types';

export async function GET() {
  const views = await listSavedOpportunityViewsForCurrentUser();
  return NextResponse.json(views);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSavedOpportunityViewInput;

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (!body.params) {
    return NextResponse.json({ error: 'params is required' }, { status: 400 });
  }

  const view = await createSavedOpportunityViewForCurrentUser(body);
  return NextResponse.json(view, { status: 201 });
}

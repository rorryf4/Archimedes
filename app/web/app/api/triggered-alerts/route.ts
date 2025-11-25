import { NextResponse } from 'next/server';
import { listTriggeredAlertEventsForCurrentUser } from '@/modules/alerts/service';

/**
 * GET /api/triggered-alerts
 * List triggered alert events for the current user
 * Query params:
 *   - limit (optional): Maximum number of events to return (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const events = await listTriggeredAlertEventsForCurrentUser(limit);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching triggered alert events:', error);
    return NextResponse.json({ error: 'Failed to fetch triggered alerts' }, { status: 500 });
  }
}

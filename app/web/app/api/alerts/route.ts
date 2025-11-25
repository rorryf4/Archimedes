import { NextResponse } from 'next/server';
import {
  listAlertsForCurrentUser,
  createAlertForCurrentUser,
  updateAlertForCurrentUser,
  deleteAlertForCurrentUser,
} from '@/modules/alerts/service';
import type { CreateAlertInput, UpdateAlertInput } from '@/modules/alerts/types';

/**
 * GET /api/alerts
 * List all alerts for the current user
 */
export async function GET() {
  try {
    const alerts = await listAlertsForCurrentUser();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

/**
 * POST /api/alerts
 * Create a new alert for the current user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: CreateAlertInput = body;

    const alert = await createAlertForCurrentUser(input);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

/**
 * PATCH /api/alerts
 * Update an existing alert for the current user
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, ...input } = body as { alertId: string } & UpdateAlertInput;

    const alert = await updateAlertForCurrentUser(alertId, input);
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

/**
 * DELETE /api/alerts
 * Delete an alert for the current user
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { alertId } = body as { alertId: string };

    const success = await deleteAlertForCurrentUser(alertId);
    if (!success) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}

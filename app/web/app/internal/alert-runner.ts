import { listOpportunities } from '@/modules/opportunities/service';
import { evaluateAlertsForOpportunities } from '@/modules/alerts/service';

/**
 * Global flag to ensure only one instance of the alert runner is active
 */
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Alert evaluation interval in milliseconds (15 seconds)
 */
const ALERT_RUNNER_INTERVAL_MS = 15_000;

/**
 * Background task that evaluates alerts against current opportunities
 * Runs every 15 seconds
 */
async function runAlertEvaluation(): Promise<void> {
  try {
    // Fetch all current opportunities
    const opportunities = await listOpportunities({});

    // Evaluate all alerts against opportunities
    // This will automatically append triggered events to the event log
    const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);

    if (triggeredEvents.length > 0) {
      console.log(`[Alert Runner] Triggered ${triggeredEvents.length} alert(s)`);
    }
  } catch (error) {
    console.error('[Alert Runner] Error during alert evaluation:', error);
  }
}

/**
 * Start the background alert runner
 * Only starts if not already running
 */
export function startAlertRunner(): void {
  if (isRunning) {
    console.log('[Alert Runner] Already running, skipping start');
    return;
  }

  console.log('[Alert Runner] Starting background alert evaluation...');
  isRunning = true;

  // Run immediately on start
  runAlertEvaluation();

  // Then run every 15 seconds
  intervalId = setInterval(runAlertEvaluation, ALERT_RUNNER_INTERVAL_MS);
}

/**
 * Stop the background alert runner
 * For testing and graceful shutdown
 */
export function stopAlertRunner(): void {
  if (!isRunning) {
    return;
  }

  console.log('[Alert Runner] Stopping background alert evaluation...');
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}

/**
 * Check if the alert runner is currently running
 */
export function isAlertRunnerActive(): boolean {
  return isRunning;
}

/**
 * Manually trigger a single alert evaluation run (for testing)
 */
export async function runAlertEvaluationOnce(): Promise<number> {
  const opportunities = await listOpportunities({});
  const triggeredEvents = await evaluateAlertsForOpportunities(opportunities);
  return triggeredEvents.length;
}

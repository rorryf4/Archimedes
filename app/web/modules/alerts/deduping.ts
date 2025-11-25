/**
 * Alert deduping tracker
 * Prevents duplicate alert triggers within a cooldown window
 */

/**
 * Cooldown period in milliseconds (5 minutes)
 */
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Key format: `${alertId}:${opportunityId}`
 * Value: timestamp of last trigger
 */
const lastTriggeredMap = new Map<string, number>();

/**
 * Generate a deduping key for an alert-opportunity pair
 */
function getDedupingKey(alertId: string, opportunityId: string): string {
  return `${alertId}:${opportunityId}`;
}

/**
 * Check if an alert should be triggered for a specific opportunity
 * Returns true if enough time has passed since the last trigger (or if never triggered)
 */
export function shouldTriggerAlert(alertId: string, opportunityId: string): boolean {
  const key = getDedupingKey(alertId, opportunityId);
  const lastTriggered = lastTriggeredMap.get(key);

  if (!lastTriggered) {
    // Never triggered before
    return true;
  }

  const now = Date.now();
  const timeSinceLastTrigger = now - lastTriggered;

  // Only trigger if cooldown period has elapsed
  return timeSinceLastTrigger >= COOLDOWN_MS;
}

/**
 * Record that an alert was triggered for a specific opportunity
 */
export function recordAlertTrigger(alertId: string, opportunityId: string): void {
  const key = getDedupingKey(alertId, opportunityId);
  lastTriggeredMap.set(key, Date.now());
}

/**
 * Clear all deduping state (for testing)
 */
export function clearDedupingState(): void {
  lastTriggeredMap.clear();
}

/**
 * Get the cooldown period in milliseconds (for testing)
 */
export function getCooldownMs(): number {
  return COOLDOWN_MS;
}

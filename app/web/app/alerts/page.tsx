import { listAlertsForCurrentUser, listTriggeredAlertEventsForCurrentUser } from '@/modules/alerts/service';
import { getSignalCatalog } from '@/modules/signals/catalog';
import { AlertsList } from '@/components/alerts/AlertsList';
import { AlertsPageClient } from '@/components/alerts/AlertsPageClient';

export default async function AlertsPage() {
  const alerts = await listAlertsForCurrentUser();
  const triggeredEvents = await listTriggeredAlertEventsForCurrentUser(50);
  const signalCatalog = getSignalCatalog();

  return (
    <AlertsPageClient initialEvents={triggeredEvents}>
      {/* Your Alerts */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Alerts</h2>
        <AlertsList alerts={alerts} signalCatalog={signalCatalog} />
      </div>
    </AlertsPageClient>
  );
}

import { AppShell } from '@/components/layout/AppShell';
import { ActivitiesContent } from '@/components/activities/ActivitiesContent';

export function ActivitiesPageWrapper() {
  return (
    <AppShell>
      <ActivitiesContent />
    </AppShell>
  );
}

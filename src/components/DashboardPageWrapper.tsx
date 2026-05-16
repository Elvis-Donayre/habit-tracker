import { AppShell } from '@/components/layout/AppShell';
import { DashboardContent } from '@/components/DashboardContent';

export function DashboardPageWrapper() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

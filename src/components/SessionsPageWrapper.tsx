import { AppShell } from '@/components/layout/AppShell';
import { SessionsContent } from '@/components/sessions/SessionsContent';

export function SessionsPageWrapper() {
  return (
    <AppShell>
      <SessionsContent />
    </AppShell>
  );
}

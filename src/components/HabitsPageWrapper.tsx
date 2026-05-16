import { AppShell } from '@/components/layout/AppShell';
import { HabitsContent } from '@/components/habits/HabitsContent';

export function HabitsPageWrapper() {
  return (
    <AppShell>
      <HabitsContent />
    </AppShell>
  );
}

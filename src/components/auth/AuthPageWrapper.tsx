import { AuthShell } from '@/components/layout/AppShell';
import { AuthPage } from '@/components/auth/AuthPage';

export function AuthPageWrapper() {
  return (
    <AuthShell>
      <AuthPage />
    </AuthShell>
  );
}

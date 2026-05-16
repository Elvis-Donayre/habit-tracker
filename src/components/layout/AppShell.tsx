import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryProvider } from '@/components/ui/QueryProvider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AuthGuard>
          <AppLayout>{children}</AppLayout>
        </AuthGuard>
      </AuthProvider>
    </QueryProvider>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}

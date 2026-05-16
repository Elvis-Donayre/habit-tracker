import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-md)]">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" suppressHydrationWarning>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" suppressHydrationWarning />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" suppressHydrationWarning />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] font-medium">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

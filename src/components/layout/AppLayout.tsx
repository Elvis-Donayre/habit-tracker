import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20 lg:pt-8 lg:pb-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

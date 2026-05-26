import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Menu, Activity } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 shrink-0 h-14 flex items-center gap-3 px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-[var(--shadow-xs)]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-text)]/[0.05] active:scale-95 transition-all"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center shrink-0">
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-semibold text-[14px] tracking-tight">Habit Tracker</span>
          </div>
        </header>
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 pt-4 lg:pt-8 lg:pb-8">
            {children}
          </div>
          {/* Spacer que empuja el contenido por encima de la barra inferior fija */}
          <div
            className="lg:hidden"
            aria-hidden="true"
            style={{ minHeight: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
          />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

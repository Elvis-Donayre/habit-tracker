import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Target, Zap, BookOpen, LogOut, Menu, X, Activity, Timer } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/temporizador', label: 'Temporizador', icon: Timer },
  { href: '/habits', label: 'Mis Hábitos', icon: Target },
  { href: '/actividades', label: 'Actividades', icon: Zap },
  { href: '/sessions', label: 'Sesiones', icon: BookOpen },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] active:scale-95 transition-transform"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-50
          bg-[var(--color-surface)] border-r border-[var(--color-border)]
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0 shadow-[var(--shadow-xl)]' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-xs)]">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">Habit Tracker</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-text)]/[0.05] transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <p className="text-[13px] font-medium truncate">{user?.email}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-[var(--font-mono)] tracking-tight">
            {user?.id?.slice(0, 8)}…
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Navegación
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] font-medium
                  transition-all duration-150 ease-out relative
                  ${isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.04]'
                  }
                `}
              >
                <Icon
                  size={17}
                  className={`shrink-0 transition-transform duration-150 ${!isActive ? 'group-hover:scale-110' : ''}`}
                />
                {item.label}
                {isActive && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/60" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[var(--color-border)] shrink-0">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-all duration-150"
          >
            <LogOut size={17} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

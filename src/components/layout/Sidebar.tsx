import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Target, Zap, BookOpen, LogOut, X, Timer, Moon, Sun } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'Hábitos', icon: Target },
  { href: '/temporizador', label: 'Temporizador', icon: Timer },
  { href: '/sessions', label: 'Sesiones', icon: BookOpen },
  { href: '/actividades', label: 'Actividades', icon: Zap },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('darkMode', String(next));
    } catch {}
    setDark(next);
  };
  return { dark, toggle };
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { signOut } = useAuth();
  const { dark, toggle } = useDarkMode();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-[250px] z-50
          bg-[var(--color-surface)] border-r border-[var(--color-border)]
          flex flex-col px-4 py-[22px]
          transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0 shadow-[var(--shadow-xl)]' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2.5 pb-[22px]">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-white font-extrabold text-[17px] shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), #F0905F)',
              boxShadow: '0 4px 12px -2px rgba(224,101,59,0.5)',
            }}
          >
            H
          </div>
          <div className="leading-tight">
            <span className="block font-bold text-[15px] tracking-tight">Hábitos</span>
            <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">tu progreso diario</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-text)]/[0.05] transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={isActive ? { boxShadow: '0 4px 12px -3px rgba(224,101,59,0.5)' } : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] leading-none
                  transition-all duration-150 ease-out
                  ${isActive
                    ? 'bg-[var(--color-accent)] text-white font-semibold'
                    : 'font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.05]'
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform duration-150 ${!isActive ? 'group-hover:scale-110' : ''}`}
                />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </a>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.05] transition-all duration-150"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-all duration-150"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>
    </>
  );
}

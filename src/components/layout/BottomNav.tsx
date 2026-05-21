import { LayoutDashboard, Timer, Target, Zap, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/temporizador', label: 'Timer', icon: Timer },
  { href: '/habits', label: 'Hábitos', icon: Target },
  { href: '/actividades', label: 'Act.', icon: Zap },
  { href: '/sessions', label: 'Sesiones', icon: BookOpen },
];

export function BottomNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe">
      <div className="h-16 flex items-center">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <a
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

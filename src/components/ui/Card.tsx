import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accentColor?: string;
  variant?: 'default' | 'flat' | 'interactive' | 'highlighted';
  children: ReactNode;
}

export function Card({ accentColor, variant = 'default', children, className = '', ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
    flat: 'bg-[var(--color-surface)] border border-[var(--color-border)]',
    interactive: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-text-muted)]/15 active:scale-[0.997] cursor-pointer',
    highlighted: 'bg-[var(--color-surface)] border border-[var(--color-accent)]/20 shadow-[var(--shadow-md)] shadow-[var(--color-accent)]/5',
  };

  return (
    <div
      className={`
        ${variantStyles[variant]}
        rounded-[var(--radius-lg)] p-5
        transition-all duration-200 ease-out
        ${className}
      `}
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: '3px' } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

type AccentToken = 'accent' | 'success' | 'warning' | 'danger' | 'info';

const accentMap: Record<AccentToken, { bg: string; fg: string }> = {
  accent:  { bg: 'var(--color-accent-soft)',  fg: 'var(--color-accent)' },
  success: { bg: 'var(--color-success-soft)', fg: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-soft)', fg: 'var(--color-warning)' },
  danger:  { bg: 'var(--color-danger-soft)',  fg: 'var(--color-danger)' },
  info:    { bg: 'var(--color-info-soft)',     fg: 'var(--color-info)' },
};

export function MetricCard({
  label,
  value,
  accentColor,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  accentColor?: AccentToken;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
}) {
  const accent = accentColor ? accentMap[accentColor] : accentMap.accent;

  return (
    <Card variant="interactive">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-2">
            {label}
          </p>
          <p className="text-[1.75rem] font-bold tracking-tight leading-none" style={{ animation: 'countUp 0.4s ease-out' }}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-medium mt-2.5 flex items-center gap-1 ${trend.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
              <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: 'currentColor' }} />
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="shrink-0 w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: accent.bg, color: accent.fg }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

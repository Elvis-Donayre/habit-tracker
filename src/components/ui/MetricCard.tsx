import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  accentColor: 'accent' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
}

const accentMap = {
  accent: { bg: 'var(--color-accent-soft)', text: 'var(--color-accent)', badge: 'icon-accent-soft' },
  success: { bg: 'var(--color-success-soft)', text: 'var(--color-success)', badge: 'icon-success-soft' },
  warning: { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', badge: 'icon-warning-soft' },
  danger: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', badge: 'icon-danger-soft' },
  info: { bg: 'var(--color-info-soft)', text: 'var(--color-info)', badge: 'icon-info-soft' },
};

export function MetricCard({ label, value, subtitle, trend, accentColor, icon }: MetricCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 flex flex-col gap-1"
      style={{
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--color-surface)',
        animation: 'fadeInUp 0.4s ease-out both',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[11px] uppercase font-semibold tracking-wide"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </span>
        {icon && (
          <div
            className={`w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center ${accent.badge}`}
            style={{ color: accent.text }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-bold text-[1.75rem] leading-none"
          style={{ animation: 'countUp 0.5s ease-out both' }}
        >
          {value}
        </span>
        {trend && (
          <span
            className="text-xs font-medium"
            style={{ color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <span
          className="text-[12px] mt-0.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

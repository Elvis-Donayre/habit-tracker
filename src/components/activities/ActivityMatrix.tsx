import { Card } from '@/components/ui/Card';
import type { ActivityHabitMatrix } from '@/types';

interface Props {
  data: ActivityHabitMatrix[];
  weekDays: string[];
}

export function ActivityMatrix({ data }: Props) {
  const byActivity = data.reduce<Record<string, { sesiones: number; minutos: number }>>(
    (acc, entry) => {
      const key = entry.actividad_nombre;
      if (!acc[key]) acc[key] = { sesiones: 0, minutos: 0 };
      acc[key].sesiones += entry.total_sesiones || 0;
      acc[key].minutos += entry.total_minutos || 0;
      return acc;
    },
    {}
  );

  const rows = Object.entries(byActivity).sort((a, b) => b[1].sesiones - a[1].sesiones);
  const maxSesiones = Math.max(...rows.map(([, s]) => s.sesiones), 1);

  return (
    <Card className="p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left py-2 pr-6 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Actividad
            </th>
            <th className="text-left py-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Progreso
            </th>
            <th className="text-right py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Sesiones
            </th>
            <th className="text-right py-2 pl-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Minutos
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, stats]) => (
            <tr key={name} className="border-b border-[var(--color-border)]/40">
              <td className="py-3 pr-6 font-medium text-sm">{name}</td>
              <td className="py-3 pr-4 w-40">
                <div className="h-1.5 rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${(stats.sesiones / maxSesiones) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  {stats.sesiones}
                </span>
              </td>
              <td className="py-3 pl-3 text-right text-[var(--color-text-muted)] text-xs">
                {stats.minutos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

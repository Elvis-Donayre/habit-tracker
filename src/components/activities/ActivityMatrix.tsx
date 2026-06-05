import { Card } from '@/components/ui/Card';

export interface MatrixRow {
  name: string;
  days: number[]; // sessions per weekday, Mon→Sun (length 7)
  minutes: number[]; // minutes per weekday, Mon→Sun (length 7)
  total: number; // total sessions
  totalMin: number; // total minutes
}

interface Props {
  rows: MatrixRow[];
  weekDays: string[];
}

export function ActivityMatrix({ rows, weekDays }: Props) {
  const maxCell = Math.max(1, ...rows.flatMap((r) => r.days));
  const todayCol = (new Date().getDay() + 6) % 7; // Mon→Sun column for today

  return (
    <Card className="p-4 overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Actividad
            </th>
            {weekDays.map((d, i) => (
              <th
                key={`${d}-${i}`}
                className={`w-9 text-center text-[11px] font-semibold uppercase ${
                  i === todayCol ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                {d}
              </th>
            ))}
            <th className="text-right py-2 pl-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="py-1 pr-4 font-medium text-sm whitespace-nowrap max-w-[160px] truncate">
                {row.name}
              </td>
              {row.days.map((count, i) => {
                const ratio = count / maxCell;
                const isHot = ratio > 0.5;
                return (
                  <td key={i} className="p-0.5">
                    <div
                      title={
                        count > 0
                          ? `${weekDays[i]}: ${count} ${count === 1 ? 'sesión' : 'sesiones'} · ${row.minutes[i]} min`
                          : `${weekDays[i]}: sin sesiones`
                      }
                      className="h-8 w-9 mx-auto rounded-[var(--radius-sm)] grid place-items-center text-[11px] font-semibold font-[var(--font-mono)]"
                      style={
                        count > 0
                          ? {
                              backgroundColor: `rgba(224, 101, 59, ${(0.15 + 0.85 * ratio).toFixed(2)})`,
                              color: isHot ? 'white' : 'var(--color-accent)',
                            }
                          : { backgroundColor: 'var(--color-border)', opacity: 0.35 }
                      }
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                );
              })}
              <td className="py-1 pl-3 text-right">
                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  {row.total}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-3">
        Cada celda cuenta las sesiones que registraste en ese día de la semana. Más intenso = más sesiones.
      </p>
    </Card>
  );
}

interface StreakHeatmapProps {
  /** ISO date (YYYY-MM-DD) -> minutes (or any count) for that day. */
  dailyMinutes: Map<string, number>;
  /** How many weeks back to render. */
  weeks?: number;
}

const LEVEL_COLORS = [
  'var(--color-border)',
  'rgba(224,101,59,0.30)',
  'rgba(224,101,59,0.55)',
  'rgba(224,101,59,0.78)',
  'var(--color-accent)',
];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * GitHub-style contribution heatmap. Columns are weeks (Mon→Sun rows),
 * cell intensity is bucketed against the busiest day in range.
 */
export function StreakHeatmap({ dailyMinutes, weeks = 18 }: StreakHeatmapProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monday-indexed day of week (Mon = 0 … Sun = 6)
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (weeks - 1) * 7);

  const cells: { iso: string; mins: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const iso = isoDate(cursor);
    cells.push({ iso, mins: dailyMinutes.get(iso) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const max = Math.max(...cells.map((c) => c.mins), 1);
  const levelFor = (mins: number) => {
    if (mins <= 0) return 0;
    const ratio = mins / max;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  return (
    <div>
      <div
        className="grid grid-flow-col gap-[3px] overflow-x-auto pb-1 scrollbar-none"
        style={{ gridTemplateRows: 'repeat(7, 1fr)' }}
      >
        {cells.map((cell) => {
          const date = new Date(cell.iso);
          const label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          return (
            <div
              key={cell.iso}
              title={`${label}: ${cell.mins} min`}
              className="w-[13px] h-[13px] rounded-[3px] transition-transform hover:scale-125"
              style={{ backgroundColor: LEVEL_COLORS[levelFor(cell.mins)] }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 justify-end mt-3 text-[11px] text-[var(--color-text-muted)]">
        menos
        {LEVEL_COLORS.map((c) => (
          <span key={c} className="w-[11px] h-[11px] rounded-[3px]" style={{ backgroundColor: c }} />
        ))}
        más
      </div>
    </div>
  );
}

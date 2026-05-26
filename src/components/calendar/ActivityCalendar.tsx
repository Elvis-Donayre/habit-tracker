import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Clock, Calendar, BookOpen } from 'lucide-react';
import type { Session } from '@/types';
import { formatDuration, getMoodEmoji } from '@/lib/helpers';
import { Card } from '@/components/ui/Card';

interface DayData {
  totalMinutes: number;
  sessions: Session[];
}

function getIntensityStyle(minutes: number): { background: string; textColor: string } {
  if (minutes === 0) return { background: 'transparent', textColor: 'var(--color-text-muted)' };
  if (minutes <= 30) return { background: 'rgba(45, 91, 255, 0.12)', textColor: 'var(--color-accent)' };
  if (minutes <= 60) return { background: 'rgba(45, 91, 255, 0.30)', textColor: 'var(--color-accent)' };
  if (minutes <= 120) return { background: 'rgba(45, 91, 255, 0.58)', textColor: '#fff' };
  return { background: 'rgba(45, 91, 255, 0.88)', textColor: '#fff' };
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const LEGEND_MINUTES = [0, 20, 50, 90, 150];

export function ActivityCalendar({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const dayMap = new Map<string, DayData>();
  sessions.forEach((session) => {
    const dateStr = session.session_date?.substring(0, 10);
    if (!dateStr) return;
    const [y, m] = dateStr.split('-').map(Number);
    if (y !== year || m !== month + 1) return;
    const existing = dayMap.get(dateStr) ?? { totalMinutes: 0, sessions: [] };
    dayMap.set(dateStr, {
      totalMinutes: existing.totalMinutes + (session.duration_minutes || 0),
      sessions: [...existing.sessions, session],
    });
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert JS Sunday=0 to Monday=0 week start
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!dayMap.has(dateStr)) return;
    setSelectedDate(dateStr);
    setDrawerOpen(true);
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedDate(null), 300);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawerOpen, closeDrawer]);

  const canGoNext = year < today.getFullYear() || month < today.getMonth();
  const selectedData = selectedDate ? dayMap.get(selectedDate) : null;

  const totalActiveDays = dayMap.size;
  const totalMonthMinutes = Array.from(dayMap.values()).reduce((s, d) => s + d.totalMinutes, 0);

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Calendario de actividad</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.05] transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              disabled={!canGoNext}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.05] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {totalActiveDays > 0 && (
          <div className="flex items-center gap-4 mb-4 px-1">
            <div className="text-center">
              <p className="text-[1.1rem] font-bold text-[var(--color-accent)]">{totalActiveDays}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">días activos</p>
            </div>
            <div className="w-px h-8 bg-[var(--color-border)]" />
            <div className="text-center">
              <p className="text-[1.1rem] font-bold">{formatDuration(totalMonthMinutes)}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">este mes</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-[var(--color-text-muted)] py-1 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = dayMap.get(dateStr);
            const minutes = data?.totalMinutes ?? 0;
            const hasActivity = minutes > 0;
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const { background, textColor } = getIntensityStyle(minutes);

            return (
              <button
                key={dateStr}
                onClick={() => hasActivity && handleDayClick(day)}
                disabled={!hasActivity}
                className={[
                  'relative flex flex-col items-center justify-center rounded-[var(--radius-sm)] transition-all duration-150 aspect-square',
                  hasActivity ? 'cursor-pointer hover:scale-[1.08] hover:shadow-[var(--shadow-sm)]' : 'cursor-default',
                  isToday ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface)]' : '',
                ].join(' ')}
                style={{ background, minHeight: '34px' }}
                aria-label={hasActivity ? `${day} ${MONTH_NAMES[month]}: ${minutes} minutos` : undefined}
              >
                <span
                  className="text-[11px] font-semibold leading-none"
                  style={{ color: textColor }}
                >
                  {day}
                </span>
                {minutes > 0 && (
                  <span className="text-[9px] font-medium leading-none mt-[3px]" style={{ color: textColor }}>
                    {minutes >= 60
                      ? `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? `${minutes % 60}` : ''}`
                      : `${minutes}m`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--color-border)]">
          <span className="text-[10px] text-[var(--color-text-muted)]">Menos</span>
          {LEGEND_MINUTES.map((m) => {
            const { background } = getIntensityStyle(m);
            return (
              <div
                key={m}
                className="w-3.5 h-3.5 rounded-[4px] border border-[var(--color-border)]"
                style={{ background: m === 0 ? 'var(--color-border)' : background }}
              />
            );
          })}
          <span className="text-[10px] text-[var(--color-text-muted)]">Más</span>
        </div>
      </Card>

      {drawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease-out both' }}
            onClick={closeDrawer}
          />
          <div
            className="relative bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] shadow-[var(--shadow-xl)] max-h-[80vh] overflow-y-auto"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[var(--color-surface)] z-10">
              <div className="w-10 h-1 rounded-[var(--radius-full)] bg-[var(--color-border)]" />
            </div>

            <div className="px-5 pb-24">
              <div className="flex items-start justify-between py-3 mb-2">
                <div>
                  <h3 className="text-base font-semibold capitalize">
                    {selectedDate &&
                      new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {selectedData?.sessions.length ?? 0}{' '}
                    {(selectedData?.sessions.length ?? 0) === 1 ? 'sesión' : 'sesiones'} ·{' '}
                    {formatDuration(selectedData?.totalMinutes ?? 0)} totales
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/[0.05] transition-colors shrink-0"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {selectedData?.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)]"
                  >
                    <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-[var(--color-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.activities?.name ?? 'Sesión sin nombre'}
                      </p>
                      {session.book_title && (
                        <p className="flex items-center gap-1 text-xs text-[var(--color-accent)] truncate mt-0.5">
                          <BookOpen size={11} className="shrink-0" />
                          {session.book_title}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                          {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-[var(--color-accent)]">
                        {session.duration_minutes}m
                      </p>
                      {session.mood ? (
                        <p className="text-sm mt-0.5">{getMoodEmoji(session.mood)}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


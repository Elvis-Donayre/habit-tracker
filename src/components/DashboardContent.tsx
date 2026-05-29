import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { useActivities } from '@/hooks/useActivities';
import { useSessions } from '@/hooks/useSessions';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Sparkline } from '@/components/ui/Sparkline';
import { StreakHeatmap } from '@/components/ui/StreakHeatmap';
import { CompletionChart } from '@/components/charts/Charts';
import { ActivityCalendar } from '@/components/calendar/ActivityCalendar';
import { formatDuration, categorizeCompletion, calculateWeeklyCompliance, getBarColor } from '@/lib/helpers';
import { Target, Clock, TrendingUp, Activity, Flame, CheckCircle2, Plus, ArrowRight } from 'lucide-react';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const STREAK_MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DashboardContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const { progress } = useHabits(userId);
  const { matrix } = useActivities(userId);
  const { weeklySummary, list: sessionsList } = useSessions(userId);

  const progressData = progress.data ?? [];
  const weeklyData = weeklySummary.data ?? [];
  const matrixData = matrix.data ?? [];
  const sessionsData = sessionsList.data ?? [];

  if (progress.isLoading || matrix.isLoading || weeklySummary.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-border)] rounded-[var(--radius-md)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <div className="h-40 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const firstError = progress.error || matrix.error || weeklySummary.error;
  if (firstError) {
    const msg = (firstError as any)?.message ?? String(firstError);
    const isPermissionError = msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden');
    return (
      <div className="space-y-3">
        <div className="alert-danger flex items-start gap-3">
          <span className="text-base shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-medium">Error al cargar los datos del dashboard</p>
            <p className="text-xs mt-1 opacity-80">{msg}</p>
          </div>
        </div>
        {isPermissionError && (
          <div className="alert-info text-sm space-y-2">
            <p className="font-medium">Posible causa: permisos de base de datos</p>
            <p>Las vistas de Supabase necesitan permisos explícitos. Ejecuta este SQL en el editor de Supabase:</p>
            <pre className="mt-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-[var(--font-mono)] overflow-x-auto whitespace-pre">{`GRANT SELECT ON habit_progress TO authenticated;
GRANT SELECT ON weekly_summary TO authenticated;
GRANT SELECT ON activity_habit_matrix TO authenticated;`}</pre>
          </div>
        )}
      </div>
    );
  }

  // ---- Per-activity aggregation (used by progreso tab + distribution) ----
  const aggregated = new Map<string, { total: number; completed: number }>();
  progressData.forEach((p) => {
    const existing = aggregated.get(p.actividad_nombre) || { total: 0, completed: 0 };
    aggregated.set(p.actividad_nombre, {
      total: existing.total + p.total_sessions,
      completed: existing.completed + (p.completed_sessions ?? p.total_sessions),
    });
  });
  const uniqueProgress = Array.from(aggregated.entries()).map(([name, data]) => ({
    actividad_nombre: name,
    total_sessions: data.total,
    completed_sessions: data.completed,
  }));

  // ---- Daily focus minutes from sessions ----
  const minutesByDate = new Map<string, number>();
  const namesCompletedToday = new Set<string>();
  const todayStr = isoDate(new Date());
  sessionsData.forEach((s) => {
    const d = (s.session_date ?? '').slice(0, 10);
    if (!d) return;
    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + (s.duration_minutes ?? 0));
    if (d === todayStr && s.activities?.name) namesCompletedToday.add(s.activities.name);
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const focusToday = minutesByDate.get(todayStr) ?? 0;
  const focusYesterday = minutesByDate.get(isoDate(yesterday)) ?? 0;
  const focusDelta = focusToday - focusYesterday;

  // Sparkline: last 14 days of focus minutes
  const sparkData: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    sparkData.push(minutesByDate.get(isoDate(d)) ?? 0);
  }

  // ---- Streak (max across habits) ----
  const currentStreak = progressData.reduce((m, p) => Math.max(m, p.current_streak ?? 0), 0);
  const longestStreak = progressData.reduce((m, p) => Math.max(m, p.longest_streak ?? 0), 0);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak) ?? currentStreak + 1;
  const milestonePct = Math.min(Math.round((currentStreak / nextMilestone) * 100), 100);

  // ---- Today's ring (sessions completed vs planned today, from matrix) ----
  const todayLetter = WEEK_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayMatrix = matrixData.filter((e) => e.dia_semana === todayLetter);
  const plannedToday = todayMatrix.reduce((s, e) => s + (e.total_sesiones || 0), 0);
  const completedToday = todayMatrix.reduce((s, e) => s + (e.sesiones_completadas ?? e.total_sesiones ?? 0), 0);
  const todayRingPct = plannedToday > 0 ? Math.round((completedToday / plannedToday) * 100) : 0;
  const pendingToday = Math.max(plannedToday - completedToday, 0);

  // ---- Weekly bars (focus minutes per weekday, current week Mon→Sun) ----
  const monday = new Date();
  const mondayDow = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - mondayDow);
  const weeklyBars = WEEK_DAYS.map((letter, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { letter, minutes: minutesByDate.get(isoDate(d)) ?? 0, isToday: isoDate(d) === todayStr };
  });
  const weekMax = Math.max(...weeklyBars.map((b) => b.minutes), 1);
  const weekTotal = weeklyBars.reduce((s, b) => s + b.minutes, 0);

  // ---- Weekly compliance + global stats ----
  const totalsByDay = new Map<string, number>();
  const completionsByDay = new Map<string, number>();
  matrixData.forEach((entry) => {
    totalsByDay.set(entry.dia_semana, (totalsByDay.get(entry.dia_semana) || 0) + (entry.total_sesiones || 0));
    completionsByDay.set(entry.dia_semana, (completionsByDay.get(entry.dia_semana) || 0) + (entry.sesiones_completadas ?? entry.total_sesiones ?? 0));
  });
  const totalSessionsThisWeek = Array.from(totalsByDay.values()).reduce((a, b) => a + b, 0);
  const completedSessionsThisWeek = Array.from(completionsByDay.values()).reduce((a, b) => a + b, 0);
  const weeklyCompliance = calculateWeeklyCompliance(completedSessionsThisWeek, totalSessionsThisWeek);

  // ---- Today's habit list (name + streak + done) ----
  const todayHabits = [...progressData]
    .filter((p) => p.actividad_nombre && p.actividad_nombre.trim())
    .map((p) => ({
      name: p.actividad_nombre,
      streak: p.current_streak ?? 0,
      done: namesCompletedToday.has(p.actividad_nombre),
    }))
    .sort((a, b) => Number(a.done) - Number(b.done) || b.streak - a.streak)
    .slice(0, 6);

  // ---- Distribution chart (top activities) ----
  const topActivities = [...uniqueProgress].sort((a, b) => b.completed_sessions - a.completed_sessions).slice(0, 3);
  const topChartData = {
    labels: topActivities.map((a) => a.actividad_nombre),
    values: topActivities.map((a) => a.completed_sessions),
  };
  const chartColors = uniqueProgress.map((_, i) => {
    const palette = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-danger)'];
    return palette[i % palette.length];
  });

  const userName = (user as any)?.full_name || user?.email?.split('@')[0] || '';
  const dateLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const tabs = [
    { id: 'progreso', label: 'Progreso', icon: <Target size={14} /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Clock size={14} /> },
  ];

  const cardBase = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] card-lift';

  return (
    <div className="space-y-6 page-enter">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight capitalize">
            Hola{userName ? `, ${userName}` : ''} <span className="inline-block">👋</span>
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1 capitalize">
            {dateLabel}
            {currentStreak > 0 && (
              <span className="normal-case"> · llevas <b className="text-[var(--color-text)]">{currentStreak} días</b> de racha 🔥</span>
            )}
          </p>
        </div>
        <a
          href="/temporizador"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-semibold shadow-[0_6px_16px_-4px_var(--color-accent-soft)] hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
          style={{ boxShadow: '0 6px 16px -4px rgba(224,101,59,0.5)' }}
        >
          <Plus size={16} strokeWidth={2.5} /> Nueva sesión
        </a>
      </div>

      {/* ---------- Bento grid ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Hero: streak */}
        <div
          className={`${cardBase} p-6 sm:col-span-2 xl:row-span-2 flex flex-col relative overflow-hidden`}
          style={{ background: 'radial-gradient(120% 120% at 100% 0%, var(--color-accent-soft) 0%, transparent 55%), var(--color-surface)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Racha actual</span>
            <Flame size={20} className="text-[var(--color-accent)]" />
          </div>
          <div
            className="text-[4.5rem] font-extrabold leading-[0.95] tracking-tight mt-3"
            style={{ background: 'linear-gradient(135deg, var(--color-accent), #F0905F)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'countUp 0.5s ease-out' }}
          >
            {currentStreak}
          </div>
          <div className="text-[1.05rem] font-semibold text-[var(--color-text-muted)]">
            {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
          </div>
          <div className="mt-auto pt-5">
            <Sparkline data={sparkData} />
          </div>
          <div className="flex items-center gap-2.5 mt-4 text-[13px] text-[var(--color-text-muted)]">
            <span>Próximo hito: <b className="text-[var(--color-text)]">{nextMilestone} días</b></span>
            <span className="flex-1 h-[7px] bg-[var(--color-border)] rounded-full overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${milestonePct}%`, background: 'linear-gradient(90deg, var(--color-accent), #F0905F)' }} />
            </span>
            <span className="font-[var(--font-mono)] text-xs">{milestonePct}%</span>
          </div>
        </div>

        {/* Ring: today */}
        <div className={`${cardBase} p-5 sm:col-span-2 flex items-center gap-5`}>
          <ProgressRing progress={todayRingPct} size={120}>
            <b className="text-[1.6rem] font-extrabold tracking-tight font-[var(--font-mono)]">{completedToday}/{plannedToday}</b>
            <span className="text-[11px] text-[var(--color-text-muted)]">hoy</span>
          </ProgressRing>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Sesiones de hoy</span>
            <div className="flex flex-col gap-2 mt-3 text-[13px]">
              <span className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-accent)]" /> {completedToday} completadas</span>
              <span className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-border)]" /> {pendingToday} pendientes</span>
              <span className="text-[var(--color-success)] font-semibold mt-0.5">{todayRingPct}% del día ✓</span>
            </div>
          </div>
        </div>

        {/* Metric: focus minutes today */}
        <div className={`${cardBase} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Minutos enfocado</span>
            <span className="w-8 h-8 rounded-[var(--radius-sm)] grid place-items-center" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}><Clock size={17} /></span>
          </div>
          <div className="text-[1.9rem] font-extrabold tracking-tight mt-3.5 leading-none font-[var(--font-mono)]" style={{ animation: 'countUp 0.4s ease-out' }}>
            {focusToday}<span className="text-base text-[var(--color-text-muted)]"> min</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1.5">
            {focusYesterday > 0 || focusToday > 0 ? (
              <span className={`font-semibold ${focusDelta >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                {focusDelta >= 0 ? '▲ +' : '▼ '}{Math.abs(focusDelta)} min
              </span>
            ) : null} {focusYesterday > 0 || focusToday > 0 ? 'vs. ayer' : 'Sin actividad hoy'}
          </div>
        </div>

        {/* Metric: weekly compliance */}
        <div className={`${cardBase} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Cumplimiento</span>
            <span className="w-8 h-8 rounded-[var(--radius-sm)] grid place-items-center" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}><CheckCircle2 size={17} /></span>
          </div>
          <div className="text-[1.9rem] font-extrabold tracking-tight mt-3.5 leading-none font-[var(--font-mono)]" style={{ animation: 'countUp 0.4s ease-out' }}>
            {Number.isFinite(weeklyCompliance.percentage) ? Math.round(weeklyCompliance.percentage) : 0}<span className="text-base text-[var(--color-text-muted)]">%</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1.5">{weeklyCompliance.status} · esta semana</div>
        </div>

        {/* Heatmap */}
        <div className={`${cardBase} p-5 sm:col-span-2 xl:col-span-4`}>
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Constancia · últimos 4 meses</span>
              <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Cada celda es un día. Más intenso = más minutos enfocado.</p>
            </div>
            {longestStreak > 0 && (
              <span className="text-[13px] font-semibold text-[var(--color-success)]">🔥 racha más larga: {longestStreak} días</span>
            )}
          </div>
          <StreakHeatmap dailyMinutes={minutesByDate} weeks={18} />
        </div>

        {/* Today's habits */}
        <div className={`${cardBase} p-5 sm:col-span-2`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Hábitos de hoy</span>
            <a href="/habits" className="text-xs text-[var(--color-accent)] font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all">Ver todos <ArrowRight size={13} /></a>
          </div>
          {todayHabits.length > 0 ? (
            <div>
              {todayHabits.map((h) => (
                <div key={h.name} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0">
                  <span
                    className="w-6 h-6 rounded-lg grid place-items-center shrink-0 border-2"
                    style={h.done
                      ? { background: 'var(--color-success)', borderColor: 'var(--color-success)', color: 'white' }
                      : { borderColor: 'var(--color-border)', color: 'transparent' }}
                  >
                    {h.done && <CheckCircle2 size={14} strokeWidth={3} />}
                  </span>
                  <span className={`text-sm font-medium flex-1 ${h.done ? 'text-[var(--color-text-muted)] line-through' : ''}`}>{h.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">🔥 <span className="font-[var(--font-mono)]">{h.streak}</span></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">Aún no tienes hábitos registrados.</p>
          )}
        </div>

        {/* Weekly bars */}
        <div className={`${cardBase} p-5 sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">Esta semana · minutos</span>
            <span className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-mono)]">total {formatDuration(weekTotal)}</span>
          </div>
          <div className="flex items-end gap-2.5 h-[130px] mt-4">
            {weeklyBars.map((b) => (
              <div key={b.letter} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[28px] rounded-t-md relative" style={{ height: `${Math.max((b.minutes / weekMax) * 100, 4)}%`, minHeight: 4 }}>
                  <div
                    className="absolute inset-0 rounded-t-md"
                    style={{ background: b.isToday ? 'linear-gradient(180deg, var(--color-accent), var(--color-accent-hover))' : 'var(--color-accent-soft)' }}
                  />
                </div>
                <span className={`text-[11px] font-medium ${b.isToday ? 'text-[var(--color-accent)] font-bold' : 'text-[var(--color-text-muted)]'}`}>{b.letter}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Deeper detail ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Distribución por actividad</h2>
          </div>
          {topChartData.values.length > 0 ? (
            <CompletionChart labels={topChartData.labels} values={topChartData.values} colors={chartColors} />
          ) : (
            <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)] text-sm">
              <p>Registra sesiones para ver la distribución</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Actividades destacadas</h2>
          </div>
          {topActivities.length > 0 ? (
            <div className="space-y-3">
              {topActivities.map((activity, index) => {
                const percentage = activity.total_sessions > 0 ? Math.round((activity.completed_sessions / activity.total_sessions) * 100) : 0;
                const barColor = getBarColor(percentage);
                const medal = ['🥇', '🥈', '🥉'][index];
                return (
                  <div key={activity.actividad_nombre ?? String(index)} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium flex items-center gap-2"><span className="text-base">{medal}</span>{activity.actividad_nombre}</span>
                      <span className="text-[13px] font-bold" style={{ color: barColor }}>{percentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-border)] rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[var(--color-text-muted)] text-sm"><p>Sin actividades todavía</p></div>
          )}
        </Card>
      </div>

      <Tabs tabs={tabs} defaultTab="progreso" variant="pills">
        {(activeTab) => (
          <>
            {activeTab === 'progreso' && (
              <div className="space-y-3 stagger-enter">
                {uniqueProgress.map((item, index) => {
                  const percentage = item.total_sessions > 0 ? Math.round((item.completed_sessions / item.total_sessions) * 100) : 0;
                  const categorization = categorizeCompletion(percentage);
                  const barColor = getBarColor(percentage);
                  return (
                    <Card key={`${item.actividad_nombre}-${index}`} variant="interactive" className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{item.actividad_nombre}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{categorization.status} · {categorization.message}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold" style={{ color: barColor }}>{categorization.icon} {percentage}%</span>
                          <div className="flex-1 bg-[var(--color-border)] rounded-full h-2 overflow-hidden min-w-[80px]">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }} />
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap font-[var(--font-mono)]">{item.completed_sessions}/{item.total_sessions}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {activeTab === 'sesiones' && (
              <div className="space-y-3 stagger-enter">
                {weeklyData.length > 0 ? (
                  weeklyData.map((item, index) => (
                    <Card key={`${item.actividad_nombre}-${index}`} variant="interactive" className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{item.actividad_nombre}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Promedio: {item.duracion_promedio_minutos?.toFixed(0) || 0} min por sesión</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-bold text-[var(--color-accent)] font-[var(--font-mono)]">{item.total_sesiones_completadas}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">completadas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-[var(--color-text)] font-[var(--font-mono)]">{formatDuration(item.duracion_total_minutos || 0)}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">total</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-3">
                      <Clock size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">No hay sesiones esta semana</p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </Tabs>

      <ActivityCalendar sessions={sessionsData} />
    </div>
  );
}

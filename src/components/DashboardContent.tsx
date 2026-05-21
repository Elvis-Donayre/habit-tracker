import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { useActivities } from '@/hooks/useActivities';
import { useSessions } from '@/hooks/useSessions';
import { Tabs } from '@/components/ui/Tabs';
import { Card, MetricCard } from '@/components/ui/Card';
import { CompletionChart } from '@/components/charts/Charts';
import { formatDuration, categorizeCompletion, calculateWeeklyCompliance, getBarColor } from '@/lib/helpers';
import { Target, Clock, TrendingUp, BarChart3, Calendar, Zap, Activity } from 'lucide-react';

export function DashboardContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const { progress } = useHabits(userId);
  const { matrix } = useActivities(userId);
  const { weeklySummary } = useSessions(userId);

  const progressData = progress.data ?? [];
  const weeklyData = weeklySummary.data ?? [];
  const matrixData = matrix.data ?? [];

  if (progress.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-border)] rounded-[var(--radius-md)]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
          <div className="h-56 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  if (progress.isError) {
    return (
      <div className="alert-danger flex items-center gap-3">
        <span className="text-base">⚠️</span>
        <p className="text-sm">Error al cargar los datos: {String(progress.error)}</p>
      </div>
    );
  }

  const aggregated = new Map<string, { total: number; completed: number }>();
  progressData.forEach((p) => {
    const existing = aggregated.get(p.actividad_nombre) || { total: 0, completed: 0 };
    aggregated.set(p.actividad_nombre, {
      total: existing.total + p.total_sessions,
      completed: existing.completed + p.completed_sessions,
    });
  });
  const uniqueProgress = Array.from(aggregated.entries()).map(([name, data]) => ({
    actividad_nombre: name,
    total_sessions: data.total,
    completed_sessions: data.completed,
  }));

  const totalSessionsAll = uniqueProgress.reduce((sum, p) => sum + p.total_sessions, 0);
  const completedSessionsAll = uniqueProgress.reduce((sum, p) => sum + p.completed_sessions, 0);
  const globalCompletionRate = totalSessionsAll > 0 ? Math.round((completedSessionsAll / totalSessionsAll) * 100) : 0;

  const weeklyCompliance = calculateWeeklyCompliance(matrixData);

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const totalsByDay = new Map<string, number>();
  const completionsByDay = new Map<string, number>();
  matrixData.forEach((entry) => {
    totalsByDay.set(entry.dia_semana, (totalsByDay.get(entry.dia_semana) || 0) + entry.total_sesiones);
    completionsByDay.set(entry.dia_semana, (completionsByDay.get(entry.dia_semana) || 0) + entry.sesiones_completadas);
  });
  const maxTotal = Math.max(...weekDays.map((d) => totalsByDay.get(d) || 0), 1);

  const todayActivityNames = matrixData
    .filter((entry) => entry.dia_semana === weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
    .filter((entry) => entry.total_sesiones > 0)
    .map((entry) => entry.actividad_nombre);

  const totalFocusTime = weeklyData.reduce((sum, w) => sum + (w.duracion_total_minutos || 0), 0);
  const avgSessionDuration = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, w) => sum + (w.duracion_promedio_minutos || 0), 0) / weeklyData.length)
    : 0;

  const topActivities = [...uniqueProgress]
    .sort((a, b) => b.completed_sessions - a.completed_sessions)
    .slice(0, 3);

  const topChartData = {
    labels: topActivities.map((a) => a.actividad_nombre),
    values: topActivities.map((a) => a.completed_sessions),
    colors: ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)'],
  };

  const chartColors = uniqueProgress.map((_, i) => {
    const palette = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-danger)'];
    return palette[i % palette.length];
  });

  const tabs = [
    { id: 'progreso', label: 'Progreso', icon: <Target size={14} /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Clock size={14} /> },
  ];

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-[var(--color-accent)]" />
            Resumen semanal
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Tu actividad y progreso de la semana actual
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-xs)]">
          <Calendar size={14} className="text-[var(--color-accent)]" />
          <span>Semana del {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-enter">
        <MetricCard
          label="Sesiones totales"
          value={totalSessionsAll}
          accentColor="accent"
          icon={<Target size={16} />}
          trend={{ value: `${globalCompletionRate}% completado`, positive: globalCompletionRate >= 50 }}
        />
        <MetricCard
          label="Tiempo enfocado"
          value={formatDuration(totalFocusTime)}
          accentColor="success"
          icon={<Clock size={16} />}
          trend={avgSessionDuration > 0 ? { value: `Promedio ${avgSessionDuration} min`, positive: true } : undefined}
        />
        <MetricCard
          label="Cumplimiento semanal"
          value={`${weeklyCompliance.percentage}%`}
          accentColor={weeklyCompliance.percentage >= 75 ? 'success' : weeklyCompliance.percentage >= 40 ? 'warning' : 'danger'}
          icon={<TrendingUp size={16} />}
          trend={{ value: weeklyCompliance.status, positive: weeklyCompliance.percentage >= 75 }}
        />
      </div>

      {topActivities.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Actividades destacadas</h2>
          </div>
          <div className="space-y-3 stagger-enter">
            {topActivities.map((activity, index) => {
              const percentage = totalSessionsAll > 0
                ? Math.round((activity.completed_sessions / totalSessionsAll) * 100)
                : 0;
              const categorization = categorizeCompletion(percentage);
              const barColor = getBarColor(percentage);
              const medal = ['🥇', '🥈', '🥉'][index];

              return (
                <div key={activity.actividad_nombre ?? String(index)} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{medal}</span>
                      <span className="text-[13px] font-medium">{activity.actividad_nombre}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                        {activity.completed_sessions}/{activity.total_sessions} sesiones
                      </span>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: barColor }}>
                      {categorization.icon} {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-border)] rounded-[var(--radius-full)] h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-[var(--radius-full)] transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {categorization.status} · {categorization.message}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold">Cumplimiento por día</h2>
            </div>
            <span className="text-[13px] font-bold text-[var(--color-accent)]">{weeklyCompliance.percentage}%</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {weekDays.map((day) => {
              const total = totalsByDay.get(day) || 0;
              const completions = completionsByDay.get(day) || 0;
              const pct = total > 0 ? Math.round((completions / total) * 100) : 0;
              const barHeight = total > 0 ? Math.max((total / maxTotal) * 100, 8) : 4;
              const today = weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day;
              const barColor = getBarColor(pct);

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex justify-center" style={{ height: '120px' }}>
                    <div
                      className={`absolute bottom-0 w-full max-w-[36px] rounded-t-[var(--radius-sm)] transition-all duration-300 ${
                        today ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''
                      }`}
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: barColor,
                        minHeight: '4px',
                      }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${today ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Distribución por actividad</h2>
          </div>
          {topChartData.values.length > 0 ? (
            <CompletionChart
              labels={topChartData.labels}
              values={topChartData.values}
              colors={chartColors}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)] text-sm">
              <p>Registra sesiones para ver la distribución</p>
            </div>
          )}
        </Card>
      </div>

      <Tabs tabs={tabs} defaultTab="progreso" variant="pills">
        {(activeTab) => (
          <>
            {activeTab === 'progreso' && (
              <div className="space-y-3 stagger-enter">
                {uniqueProgress.map((item, index) => {
                  const percentage = item.total_sessions > 0
                    ? Math.round((item.completed_sessions / item.total_sessions) * 100)
                    : 0;
                  const categorization = categorizeCompletion(percentage);
                  const barColor = getBarColor(percentage);

                  return (
                    <Card key={`${item.actividad_nombre}-${index}`} variant="interactive" className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{item.actividad_nombre}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {categorization.status} · {categorization.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold" style={{ color: barColor }}>
                            {categorization.icon} {percentage}%
                          </span>
                          <div className="flex-1 bg-[var(--color-border)] rounded-[var(--radius-full)] h-2 overflow-hidden">
                            <div
                              className="h-full rounded-[var(--radius-full)] transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                            {item.completed_sessions}/{item.total_sessions}
                          </span>
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
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Promedio: {item.duracion_promedio_minutos?.toFixed(0) || 0} min por sesión
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-bold text-[var(--color-accent)]">
                              {item.total_sesiones_completadas}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">completadas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-[var(--color-text)]">
                              {formatDuration(item.duracion_total_minutos || 0)}
                            </p>
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

      {todayActivityNames.length > 0 && (
        <Card className="p-4 bg-[var(--color-success-soft)] border-[var(--color-success)]/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-success)]">Actividades de hoy</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {todayActivityNames.join(' · ')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

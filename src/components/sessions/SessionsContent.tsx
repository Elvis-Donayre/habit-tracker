import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { useSessions } from '@/hooks/useSessions';
import { Tabs } from '@/components/ui/Tabs';
import { Card, MetricCard } from '@/components/ui/Card';
import { formatDuration, formatDateSpanish, getMoodEmoji, getProductivityBars } from '@/lib/helpers';
import { Plus, List, BookOpen, Clock, TrendingUp, Download, Book } from 'lucide-react';

export function SessionsContent() {
  const { user } = useAuth();
  const userId = user?.id!;

  return (
    <div className="space-y-6">
      <h1 className="text-[1.65rem] font-bold tracking-tight flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-[var(--color-accent)]" />
        </span>
        Registrar Sesión
      </h1>

      <Tabs
        tabs={[
          { id: 'new', label: 'Nueva Sesión', icon: <Plus size={16} /> },
          { id: 'history', label: 'Sesiones Recientes', icon: <List size={16} /> },
          { id: 'books', label: 'Mis Libros', icon: <Book size={16} /> },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === 'new' && <NewSessionForm userId={userId} />}
            {activeTab === 'history' && <SessionHistory userId={userId} />}
            {activeTab === 'books' && <BookStats userId={userId} />}
          </>
        )}
      </Tabs>
    </div>
  );
}

function NewSessionForm({ userId }: { userId: string }) {
  const activities = useActivities(userId);
  const sessions = useSessions(userId);
  const activityList = activities.list.data ?? [];

  const [activityId, setActivityId] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [notes, setNotes] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedActivity = activityList.find((a) => a.id === activityId);
  const [links, setLinks] = useState<any[]>([]);

  const handleActivityChange = async (id: string) => {
    setActivityId(id);
    if (id) {
      const l = await activities.getLinks(id);
      setLinks(l);
    } else {
      setLinks([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!activityId) {
      setError('Selecciona una actividad');
      return;
    }
    setLoading(true);
    try {
      await sessions.register.mutateAsync({
        activity_id: activityId,
        duration_minutes: duration,
        session_date: sessionDate,
        mood,
        productivity_level: productivity,
        notes: notes.trim() || undefined,
        book_title: bookTitle.trim() || undefined,
      });
      setSuccess(`¡Sesión registrada! ${duration} minutos en ${selectedActivity?.name}`);
      setNotes('');
      setBookTitle('');
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('Error registrando sesión');
    }
    setLoading(false);
  };

  const moodLabels: Record<number, string> = {
    1: '😢 Mal',
    2: '😕 Regular',
    3: '😐 Bien',
    4: '😊 Muy bien',
    5: '😄 Excelente',
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold mb-6">Registrar Nueva Sesión</h3>

      {activityList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)]">No tienes actividades creadas. Crea una primero en la pestaña de Actividades.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="alert-danger text-sm">{error}</div>}
          {success && <div className="alert-success text-sm">{success}</div>}

          <div>
            <label className="block text-sm font-medium mb-1.5">¿Qué actividad realizaste?</label>
            <select
              value={activityId}
              onChange={(e) => handleActivityChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="">-- Seleccionar actividad --</option>
              {activityList.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {links.length > 0 && (
            <div className="alert-info text-sm">
              <p className="font-medium mb-1">Esta actividad contribuye a:</p>
              {links.map((l: any, i: number) => {
                const hName = l.habits?.name ?? 'Desconocido';
                const w = l.weight ?? 1.0;
                return <p key={i}>• {hName} ({(w * 100).toFixed(0)}%)</p>;
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Duración (minutos)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={480}
                step={5}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-[var(--font-mono)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <p className="text-sm font-medium mb-4">Estado y Productividad</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-2">¿Cómo te sentías?</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
                <p className="text-sm mt-1">{moodLabels[mood]}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-2">Nivel de productividad</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={productivity}
                  onChange={(e) => setProductivity(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
                <p className="text-sm font-[var(--font-mono)] mt-1">{getProductivityBars(productivity)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Libro (opcional)</label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Ej: El Hobbit"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Aprendí sobre Serverless en AWS. Muy productivo hoy."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
            />
          </div>

          {/* Summary */}
          {selectedActivity && (
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg surface-dim border border-[var(--color-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Actividad</p>
                <p className="text-sm font-semibold truncate">{selectedActivity.name}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Duración</p>
                <p className="text-sm font-semibold">{formatDuration(duration)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Fecha</p>
                <p className="text-sm font-semibold">{formatDateSpanish(new Date(sessionDate + 'T12:00:00'))}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Registrando...' : 'Registrar Sesión'}
          </button>
        </form>
      )}
    </Card>
  );
}

function SessionHistory({ userId }: { userId: string }) {
  const sessions = useSessions(userId);
  const sessionList = sessions.list.data ?? [];

  const [period, setPeriod] = useState('7');

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(period));

  const filtered = sessionList.filter((s) => {
    const d = new Date(s.session_date);
    return d >= cutoff;
  });

  const totalDuration = filtered.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const avgDuration = filtered.length > 0 ? totalDuration / filtered.length : 0;
  const avgMood = filtered.length > 0
    ? filtered.reduce((sum, s) => sum + (s.mood ?? 3), 0) / filtered.length
    : 0;

  const handleExport = () => {
    const headers = ['Fecha', 'Actividad', 'Libro', 'Duración (min)', 'Mood', 'Productividad', 'Notas'];
    const rows = filtered.map((s) => [
      s.session_date,
      s.activities?.name ?? 'N/A',
      (s.book_title ?? '').replace(/,/g, ';'),
      s.duration_minutes,
      s.mood ?? '',
      s.productivity_level ?? '',
      (s.notes ?? '').replace(/,/g, ';'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesiones_${period}dias.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
        </select>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover-surface transition-colors"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-5">
          <p className="text-center py-8 text-[var(--color-text-muted)]">No hay sesiones en este período.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Sesiones" value={filtered.length} accentColor="accent" icon={<BookOpen size={18} />} />
            <MetricCard label="Tiempo Total" value={formatDuration(totalDuration)} accentColor="success" icon={<Clock size={18} />} />
            <MetricCard label="Promedio/Sesión" value={formatDuration(Math.round(avgDuration))} accentColor="warning" icon={<TrendingUp size={18} />} />
            <MetricCard label="Mood Promedio" value={`${avgMood.toFixed(1)}/5`} accentColor="info" icon={<span className="text-lg">{getMoodEmoji(Math.round(avgMood))}</span>} />
          </div>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Detalle de Sesiones</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Fecha</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Actividad</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Libro</th>
                    <th className="text-right py-2 font-medium text-[var(--color-text-muted)]">Duración</th>
                    <th className="text-center py-2 font-medium text-[var(--color-text-muted)]">Mood</th>
                    <th className="text-center py-2 font-medium text-[var(--color-text-muted)]">Prod.</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 text-xs font-[var(--font-mono)]">{s.session_date}</td>
                      <td className="py-2.5 font-medium">{s.activities?.name ?? 'N/A'}</td>
                      <td className="py-2.5 text-xs text-[var(--color-text-muted)] max-w-[140px] truncate">{s.book_title ?? '—'}</td>
                      <td className="py-2.5 text-right font-[var(--font-mono)] text-xs">{formatDuration(s.duration_minutes)}</td>
                      <td className="py-2.5 text-center">{s.mood ? getMoodEmoji(s.mood) : '—'}</td>
                      <td className="py-2.5 text-center font-[var(--font-mono)] text-xs">{s.productivity_level ?? '—'}</td>
                      <td className="py-2.5 text-xs text-[var(--color-text-muted)] max-w-[200px] truncate">{s.notes ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function BookStats({ userId }: { userId: string }) {
  const sessions = useSessions(userId);
  const sessionList = sessions.list.data ?? [];

  const bookSessions = sessionList.filter((s) => !!s.book_title);

  const byBook = bookSessions.reduce<Record<string, { minutes: number; sessions: number; lastDate: string }>>((acc, s) => {
    const title = s.book_title!;
    if (!acc[title]) acc[title] = { minutes: 0, sessions: 0, lastDate: s.session_date };
    acc[title].minutes += s.duration_minutes ?? 0;
    acc[title].sessions += 1;
    if (s.session_date > acc[title].lastDate) acc[title].lastDate = s.session_date;
    return acc;
  }, {});

  const books = Object.entries(byBook).sort((a, b) => b[1].minutes - a[1].minutes);

  const totalMinutes = books.reduce((sum, [, s]) => sum + s.minutes, 0);

  if (books.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-4">
          <Book size={28} className="text-[var(--color-accent)]" />
        </div>
        <h3 className="text-sm font-semibold mb-1">Sin libros registrados</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Al registrar una sesión, indica el libro que estabas leyendo para verlo aquí.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard label="Libros distintos" value={books.length} accentColor="accent" icon={<Book size={18} />} />
        <MetricCard label="Tiempo total" value={formatDuration(totalMinutes)} accentColor="success" icon={<Clock size={18} />} />
        <MetricCard label="Sesiones" value={bookSessions.length} accentColor="info" icon={<List size={18} />} />
      </div>

      <Card className="p-5">
        <h3 className="text-base font-semibold mb-4">Tiempo por libro</h3>
        <div className="space-y-3">
          {books.map(([title, stats], i) => {
            const pct = totalMinutes > 0 ? (stats.minutes / totalMinutes) * 100 : 0;
            return (
              <div key={title}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[var(--color-text-muted)] w-5 shrink-0">#{i + 1}</span>
                    <span className="text-sm font-medium truncate">{title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-[var(--color-text-muted)]">{stats.sessions} ses.</span>
                    <span className="text-sm font-semibold font-[var(--font-mono)]">{formatDuration(stats.minutes)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Última sesión: {formatDateSpanish(new Date(stats.lastDate + 'T12:00:00'))}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

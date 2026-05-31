import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { useSessions } from '@/hooks/useSessions';
import { Tabs } from '@/components/ui/Tabs';
import { Card, MetricCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatDateSpanish, getMoodEmoji, getProductivityBars } from '@/lib/helpers';
import { Plus, List, BookOpen, Clock, TrendingUp, Download, Book, Trash2, Library } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import type { Session } from '@/types';

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
          { id: 'books', label: 'Biblioteca', icon: <Book size={16} /> },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === 'new' && <NewSessionForm userId={userId} />}
            {activeTab === 'history' && <SessionHistory userId={userId} />}
            {activeTab === 'books' && <BookLibrary userId={userId} />}
          </>
        )}
      </Tabs>
    </div>
  );
}

function NewSessionForm({ userId }: { userId: string }) {
  const activities = useActivities(userId);
  const sessions = useSessions(userId);
  const books = useBooks(userId);
  const activityList = activities.list.data ?? [];
  const bookList = books.list.data ?? [];

  const [activityId, setActivityId] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [notes, setNotes] = useState('');
  const [bookId, setBookId] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [englishMinutes, setEnglishMinutes] = useState<number | ''>('');
  const [englishActivityId, setEnglishActivityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedActivity = activityList.find((a) => a.id === activityId);
  const [links, setLinks] = useState<any[]>([]);

  const isLecturaActivity = Boolean(
    selectedActivity &&
      (selectedActivity.tipo === 'Lectura' ||
        selectedActivity.name.toLowerCase().includes('lectura') ||
        selectedActivity.name.toLowerCase().includes('libro')),
  );

  const handleActivityChange = async (id: string) => {
    setActivityId(id);
    setBookId('');
    setBookTitle('');
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
    if (englishMinutes !== '' && englishMinutes > duration) {
      setError('Los minutos en inglés no pueden superar la duración total');
      return;
    }
    if (englishMinutes !== '' && englishMinutes > 0 && !englishActivityId) {
      setError('Selecciona la actividad donde registrar los minutos en inglés');
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
      if (englishMinutes !== '' && englishMinutes > 0 && englishActivityId) {
        await sessions.register.mutateAsync({
          activity_id: englishActivityId,
          duration_minutes: englishMinutes,
          session_date: sessionDate,
          mood,
          productivity_level: productivity,
        });
      }
      const englishActivity = activityList.find((a) => a.id === englishActivityId);
      const englishNote = englishMinutes && englishActivityId
        ? ` · ${englishMinutes} min en ${englishActivity?.name}`
        : '';
      setSuccess(`¡Sesión registrada! ${duration} minutos en ${selectedActivity?.name}${englishNote}`);
      setNotes('');
      setBookId('');
      setBookTitle('');
      setEnglishMinutes('');
      setEnglishActivityId('');
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

          <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
            <p className="text-sm font-medium">
              ¿Parte del tiempo fue en inglés?{' '}
              <span className="text-xs text-[var(--color-text-muted)] font-normal">(opcional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">Minutos en inglés</label>
                <input
                  type="number"
                  value={englishMinutes}
                  onChange={(e) => setEnglishMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  max={duration}
                  placeholder="—"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-[var(--font-mono)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">Registrar en</label>
                <select
                  value={englishActivityId}
                  onChange={(e) => setEnglishActivityId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="">-- Actividad --</option>
                  {activityList.filter((a) => a.id !== activityId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {englishMinutes !== '' && englishMinutes > 0 && englishActivityId && (
              <p className="text-xs text-[var(--color-text-muted)]">
                💡 Se creará un registro adicional de {englishMinutes} min en &quot;{activityList.find((a) => a.id === englishActivityId)?.name}&quot;
              </p>
            )}
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

          {isLecturaActivity && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Libro</label>
              {bookList.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={bookId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookId(val);
                      if (val === 'custom' || val === '') {
                        setBookTitle('');
                      } else {
                        const found = bookList.find((b) => b.id === val);
                        setBookTitle(found?.title ?? '');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="">-- Seleccionar libro --</option>
                    {bookList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}{b.author ? ` — ${b.author}` : ''}
                      </option>
                    ))}
                    <option value="custom">Otro título...</option>
                  </select>
                  {bookId === 'custom' && (
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Escribe el título del libro"
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Ej: El Hobbit"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Agrega libros en la pestaña Biblioteca para seleccionarlos rápidamente.
                  </p>
                </div>
              )}
            </div>
          )}

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
                {englishMinutes !== '' && englishMinutes > 0 && englishActivityId && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">+ {englishMinutes} min inglés</p>
                )}
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
  const [toDelete, setToDelete] = useState<Session | null>(null);

  const handleConfirmDelete = async () => {
    if (!toDelete?.id) return;
    try {
      await sessions.remove.mutateAsync(toDelete.id);
      setToDelete(null);
    } catch {
      // mantener el modal abierto si falla
    }
  };

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
                    <th className="text-right py-2 font-medium text-[var(--color-text-muted)] sr-only">Acciones</th>
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
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => setToDelete(s)}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                          aria-label="Eliminar sesión"
                          title="Eliminar sesión"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Eliminar sesión"
      >
        <div className="space-y-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            ¿Seguro que quieres eliminar esta sesión
            {toDelete?.activities?.name ? (
              <> de <span className="font-medium text-[var(--color-text)]">{toDelete.activities.name}</span></>
            ) : null}
            {toDelete ? <> del {toDelete.session_date}</> : null}
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={sessions.remove.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={sessions.remove.isPending}>
              <Trash2 size={16} />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookLibrary({ userId }: { userId: string }) {
  const books = useBooks(userId);
  const sessions = useSessions(userId);
  const bookList = books.list.data ?? [];
  const sessionList = sessions.list.data ?? [];

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addError, setAddError] = useState('');

  const bookSessions = sessionList.filter((s) => !!s.book_title);
  const byBook = bookSessions.reduce<Record<string, { minutes: number; sessions: number; lastDate: string }>>((acc, s) => {
    const t = s.book_title!;
    if (!acc[t]) acc[t] = { minutes: 0, sessions: 0, lastDate: s.session_date };
    acc[t].minutes += s.duration_minutes ?? 0;
    acc[t].sessions += 1;
    if (s.session_date > acc[t].lastDate) acc[t].lastDate = s.session_date;
    return acc;
  }, {});

  const totalReadingMinutes = Object.values(byBook).reduce((s, b) => s + b.minutes, 0);
  const statsByTitle = Object.entries(byBook).sort((a, b) => b[1].minutes - a[1].minutes);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setAddError('Escribe un título'); return; }
    setAddError('');
    try {
      await books.add.mutateAsync({ title, author: author || undefined });
      setTitle('');
      setAuthor('');
    } catch {
      setAddError('Error guardando libro');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Library size={16} className="text-[var(--color-accent)]" />
          Agregar a mi biblioteca
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          {addError && <div className="alert-danger text-sm">{addError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del libro *"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Autor (opcional)"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={books.add.isPending}
            className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all text-sm"
          >
            {books.add.isPending ? 'Guardando...' : 'Agregar libro'}
          </button>
        </form>
      </Card>

      {bookList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard label="En biblioteca" value={bookList.length} accentColor="accent" icon={<Book size={18} />} />
          <MetricCard label="Tiempo lectura" value={formatDuration(totalReadingMinutes)} accentColor="success" icon={<Clock size={18} />} />
          <MetricCard label="Sesiones" value={bookSessions.length} accentColor="info" icon={<List size={18} />} />
        </div>
      )}

      {bookList.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-4">
            <Book size={28} className="text-[var(--color-accent)]" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Biblioteca vacía</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Agrega libros arriba para seleccionarlos al registrar sesiones de lectura.
          </p>
        </Card>
      ) : (
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-4">Mi biblioteca ({bookList.length})</h3>
          <div className="space-y-2">
            {bookList.map((book) => {
              const stats = byBook[book.title];
              return (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)]"
                >
                  <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{book.title}</p>
                    {book.author && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{book.author}</p>
                    )}
                    {stats && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {formatDuration(stats.minutes)} · {stats.sessions} {stats.sessions === 1 ? 'sesión' : 'sesiones'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => books.remove.mutate(book.id)}
                    disabled={books.remove.isPending}
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors shrink-0"
                    aria-label="Eliminar libro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {statsByTitle.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-4">Tiempo por libro</h3>
          <div className="space-y-3">
            {statsByTitle.map(([bookTitle, stats], i) => {
              const pct = totalReadingMinutes > 0 ? (stats.minutes / totalReadingMinutes) * 100 : 0;
              return (
                <div key={bookTitle}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-[var(--color-text-muted)] w-5 shrink-0">#{i + 1}</span>
                      <span className="text-sm font-medium truncate">{bookTitle}</span>
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
      )}
    </div>
  );
}

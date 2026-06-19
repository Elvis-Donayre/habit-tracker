import { useMemo, useState } from 'react';
import { Card, MetricCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDuration, formatDateSpanish } from '@/lib/helpers';
import { useBooks } from '@/hooks/useBooks';
import { useSessions } from '@/hooks/useSessions';
import { useBookReadings, todayISO } from '@/hooks/useBookReadings';
import type { Book, BookReading, Session } from '@/types';
import {
  Library, Book as BookIcon, BookOpen, Clock, Trash2, CheckCircle2,
  RefreshCw, Star, CalendarDays, Repeat, Trophy,
} from 'lucide-react';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);

function diffDays(start: string, end: string): number {
  const a = new Date(start + 'T12:00:00').getTime();
  const b = new Date(end + 'T12:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

const roundLabel = (n: number) => (n === 1 ? '1ª lectura' : `${n - 1}ª relectura`);

/** Minutes/sessions of a book within a reading-round window, matched by title + date range. */
function windowStats(title: string, start: string, end: string, sessions: Session[]) {
  let minutes = 0;
  let count = 0;
  for (const s of sessions) {
    if (s.book_title === title && s.session_date >= start && s.session_date <= end) {
      minutes += s.duration_minutes ?? 0;
      count += 1;
    }
  }
  return { minutes, count };
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className="p-0.5 text-[var(--color-accent)] transition-transform hover:scale-110"
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          <Star size={22} fill={n <= value ? 'currentColor' : 'none'} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function StarsStatic({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center text-[var(--color-accent)]">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} fill={n <= value ? 'currentColor' : 'none'} strokeWidth={2} />
      ))}
    </span>
  );
}

export function BookLibrary({ userId }: { userId: string }) {
  const books = useBooks(userId);
  const sessions = useSessions(userId);
  const readings = useBookReadings(userId);

  const bookList = books.list.data ?? [];
  const sessionList = sessions.list.data ?? [];
  const readingList = readings.list.data ?? [];

  // ---- add-book form ----
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addError, setAddError] = useState('');

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

  // ---- aggregate sessions by title (kept for "Mi biblioteca" + "Tiempo por libro") ----
  const bookSessions = useMemo(() => sessionList.filter((s) => !!s.book_title), [sessionList]);
  const byBook = useMemo(() => {
    return bookSessions.reduce<Record<string, { minutes: number; sessions: number; lastDate: string }>>((acc, s) => {
      const t = s.book_title!;
      if (!acc[t]) acc[t] = { minutes: 0, sessions: 0, lastDate: s.session_date };
      acc[t].minutes += s.duration_minutes ?? 0;
      acc[t].sessions += 1;
      if (s.session_date > acc[t].lastDate) acc[t].lastDate = s.session_date;
      return acc;
    }, {});
  }, [bookSessions]);

  const totalReadingMinutes = useMemo(() => Object.values(byBook).reduce((s, b) => s + b.minutes, 0), [byBook]);
  const statsByTitle = useMemo(() => Object.entries(byBook).sort((a, b) => b[1].minutes - a[1].minutes), [byBook]);

  // ---- readings grouped by book ----
  const roundsByBook = useMemo(() => {
    const map = new Map<string, BookReading[]>();
    for (const r of readingList) {
      const arr = map.get(r.book_id) ?? [];
      arr.push(r);
      map.set(r.book_id, arr);
    }
    return map;
  }, [readingList]);

  // ---- KPIs ----
  const currentYear = new Date().getFullYear();
  const finishedRounds = useMemo(() => readingList.filter((r) => r.finished_at), [readingList]);
  const rereadCount = useMemo(() => readingList.filter((r) => r.round_number >= 2).length, [readingList]);
  const finishedTitlesThisYear = useMemo(() => {
    const titles = new Set<string>();
    for (const r of finishedRounds) {
      if (yearOf(r.finished_at!) === currentYear) titles.add(r.book_id);
    }
    return titles.size;
  }, [finishedRounds, currentYear]);
  const avgDaysToFinish = useMemo(() => {
    const spans = finishedRounds
      .filter((r) => r.finished_at && r.started_at)
      .map((r) => diffDays(r.started_at, r.finished_at!));
    if (spans.length === 0) return null;
    return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);
  }, [finishedRounds]);

  // ---- library state ring (terminado / en curso / sin empezar) ----
  const ring = useMemo(() => {
    let enCurso = 0, terminado = 0, sinEmpezar = 0;
    for (const b of bookList) {
      const rounds = roundsByBook.get(b.id) ?? [];
      if (rounds.some((r) => !r.finished_at)) enCurso += 1;
      else if (rounds.length > 0) terminado += 1;
      else sinEmpezar += 1;
    }
    return { enCurso, terminado, sinEmpezar, total: bookList.length };
  }, [bookList, roundsByBook]);

  // ---- "Vale la pena releer": books with >= 2 finished rounds ----
  const rereadLeaders = useMemo(() => {
    const rows = bookList
      .map((b) => {
        const fin = (roundsByBook.get(b.id) ?? []).filter((r) => r.finished_at)
          .sort((a, z) => a.round_number - z.round_number);
        return { book: b, count: fin.length, last: fin[fin.length - 1] };
      })
      .filter((r) => r.count >= 2)
      .sort((a, z) => z.count - a.count);
    return rows;
  }, [bookList, roundsByBook]);

  // ---- monthly reading time (last 6 months) ----
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; key: string; minutes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: MONTHS_SHORT[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, minutes: 0 });
    }
    for (const s of bookSessions) {
      const k = s.session_date.slice(0, 7);
      const b = buckets.find((x) => x.key === k);
      if (b) b.minutes += s.duration_minutes ?? 0;
    }
    const max = Math.max(1, ...buckets.map((b) => b.minutes));
    return { buckets, max };
  }, [bookSessions]);

  // ---- finished per year (bar = unique titles, table = reads + titles + hours) ----
  const yearly = useMemo(() => {
    const reads = new Map<number, { reads: number; titles: Set<string> }>();
    for (const r of finishedRounds) {
      const y = yearOf(r.finished_at!);
      const e = reads.get(y) ?? { reads: 0, titles: new Set<string>() };
      e.reads += 1;
      e.titles.add(r.book_id);
      reads.set(y, e);
    }
    const minutesByYear = new Map<number, number>();
    for (const s of bookSessions) {
      const y = yearOf(s.session_date);
      minutesByYear.set(y, (minutesByYear.get(y) ?? 0) + (s.duration_minutes ?? 0));
    }
    const years = Array.from(new Set([...reads.keys(), ...minutesByYear.keys()])).sort((a, b) => a - b);
    const rows = years.map((y) => ({
      year: y,
      reads: reads.get(y)?.reads ?? 0,
      titles: reads.get(y)?.titles.size ?? 0,
      minutes: minutesByYear.get(y) ?? 0,
    }));
    const maxTitles = Math.max(1, ...rows.map((r) => r.titles));
    return { rows, maxTitles };
  }, [finishedRounds, bookSessions]);

  // ---- modal state ----
  type ModalState =
    | { kind: 'finish'; book: Book; reading: BookReading }
    | { kind: 'log'; book: Book; nextRound: number }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div className="space-y-6">
      {/* Add to library */}
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

      {bookList.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-4">
            <BookIcon size={28} className="text-[var(--color-accent)]" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Biblioteca vacía</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Agrega libros arriba para seleccionarlos al registrar sesiones de lectura.
          </p>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Terminados este año" value={finishedTitlesThisYear} accentColor="success" icon={<CheckCircle2 size={18} />} />
            <MetricCard label="Tiempo de lectura" value={formatDuration(totalReadingMinutes)} accentColor="accent" icon={<Clock size={18} />} />
            <MetricCard label="Relecturas" value={rereadCount} accentColor="accent" icon={<Repeat size={18} />} />
            <MetricCard label="Días para terminar" value={avgDaysToFinish == null ? '—' : `${avgDaysToFinish} d`} accentColor="info" icon={<CalendarDays size={18} />} />
          </div>

          {/* Ring + reread leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-base font-semibold mb-4">Estado de la biblioteca</h3>
              <LibraryRing {...ring} />
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-[var(--color-accent)]" />
                Vale la pena releer
              </h3>
              {rereadLeaders.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">
                  Aún no tienes libros leídos más de una vez.
                </p>
              ) : (
                <div className="space-y-1">
                  {rereadLeaders.map(({ book, count, last }) => (
                    <div key={book.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                        <BookOpen size={15} className="text-[var(--color-accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{book.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                          {last?.finished_at && <>última: {formatDateSpanish(new Date(last.finished_at + 'T12:00:00'))}</>}
                          {last?.rating ? <StarsStatic value={last.rating} /> : null}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-white shrink-0">×{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Mi biblioteca (with reading rounds + actions) */}
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">Mi biblioteca ({bookList.length})</h3>
            <div className="space-y-3">
              {bookList.map((book) => {
                const stats = byBook[book.title];
                const rounds = (roundsByBook.get(book.id) ?? []).slice().sort((a, b) => a.round_number - b.round_number);
                const active = rounds.find((r) => !r.finished_at);
                const finished = rounds.filter((r) => r.finished_at);
                const nextRound = rounds.reduce((m, r) => Math.max(m, r.round_number), 0) + 1;

                return (
                  <div key={book.id} className="rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-[var(--color-accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{book.title}</p>
                        {book.author && <p className="text-xs text-[var(--color-text-muted)] truncate">{book.author}</p>}
                        {stats && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {formatDuration(stats.minutes)} · {stats.sessions} {stats.sessions === 1 ? 'sesión' : 'sesiones'}
                          </p>
                        )}
                      </div>
                      {active ? (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] shrink-0">● En curso</span>
                      ) : finished.length > 0 ? (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] shrink-0">✓ Terminado</span>
                      ) : null}
                      <button
                        onClick={() => books.remove.mutate(book.id)}
                        disabled={books.remove.isPending}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors shrink-0"
                        aria-label="Eliminar libro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* rounds timeline */}
                    {rounds.length > 0 && (
                      <div className="mt-3 pl-12 space-y-1.5">
                        {rounds.map((r) => {
                          const end = r.finished_at ?? todayISO();
                          const w = windowStats(book.title, r.started_at, end, bookSessions);
                          return (
                            <div key={r.id} className="flex items-center gap-2 text-xs group">
                              <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${r.finished_at ? 'bg-[var(--color-success)] text-white' : 'border-2 border-[var(--color-accent)] text-[var(--color-accent)]'}`}>
                                {r.round_number}
                              </span>
                              <span className="font-medium">{roundLabel(r.round_number)}</span>
                              <span className="text-[var(--color-text-muted)]">· {formatDuration(w.minutes)} · {w.count} ses.</span>
                              {r.finished_at ? (
                                <span className="text-[var(--color-success)] font-medium">· ✓ {formatDateSpanish(new Date(r.finished_at + 'T12:00:00'))}</span>
                              ) : (
                                <span className="text-[var(--color-accent)] font-medium">· {diffDays(r.started_at, todayISO())} d en curso</span>
                              )}
                              {r.rating ? <StarsStatic value={r.rating} /> : null}
                              <button
                                onClick={() => readings.remove.mutate(r.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all"
                                aria-label="Eliminar ronda"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* actions */}
                    <div className="mt-3 pl-12 flex flex-wrap gap-2">
                      {active ? (
                        <Button size="sm" variant="success" icon={<CheckCircle2 size={14} />} onClick={() => setModal({ kind: 'finish', book, reading: active })}>
                          Marcar terminado
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={finished.length > 0 ? <RefreshCw size={14} /> : <BookOpen size={14} />}
                          onClick={() => readings.start.mutate({ bookId: book.id, roundNumber: nextRound })}
                          loading={readings.start.isPending}
                        >
                          {finished.length > 0 ? 'Empezar relectura' : 'Empezar lectura'}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'log', book, nextRound })}>
                        + Registrar lectura pasada
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tiempo por libro (kept) */}
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
                        <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
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

          {/* Tiempo de lectura por mes */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Tiempo de lectura por mes</h3>
              <span className="text-xs text-[var(--color-text-muted)]">últimos 6 meses</span>
            </div>
            <div className="flex items-end gap-3 h-36">
              {monthly.buckets.map((b) => (
                <div key={b.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">{b.minutes > 0 ? formatDuration(b.minutes) : ''}</span>
                  <div
                    className="w-full max-w-[34px] rounded-t-md bg-[var(--color-accent)] transition-all min-h-[2px]"
                    style={{ height: `${(b.minutes / monthly.max) * 100}%` }}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Libros terminados por año */}
          {yearly.rows.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Libros terminados por año</h3>
                <span className="text-xs text-[var(--color-text-muted)]">barra = títulos únicos</span>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
                <div className="flex items-end gap-3 h-36 flex-1">
                  {yearly.rows.map((r) => (
                    <div key={r.year} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[13px] font-bold text-[var(--color-accent)]">{r.titles || ''}</span>
                      <div
                        className="w-full max-w-[40px] rounded-t-md bg-[var(--color-accent)] transition-all min-h-[2px]"
                        style={{ height: `${(r.titles / yearly.maxTitles) * 100}%` }}
                      />
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">{r.year === currentYear ? `${r.year}*` : r.year}</span>
                    </div>
                  ))}
                </div>
                <table className="text-[13px] shrink-0">
                  <thead>
                    <tr className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      <th className="text-left font-semibold pb-2 pr-5">Año</th>
                      <th className="text-right font-semibold pb-2 pl-5">Lecturas</th>
                      <th className="text-right font-semibold pb-2 pl-5">Títulos</th>
                      <th className="text-right font-semibold pb-2 pl-5">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearly.rows.slice().reverse().map((r) => (
                      <tr key={r.year} className="border-t border-[var(--color-border)]">
                        <td className="text-left py-1.5 pr-5 text-[var(--color-text-muted)]">{r.year === currentYear ? `${r.year}*` : r.year}</td>
                        <td className="text-right py-1.5 pl-5 font-semibold">{r.reads}</td>
                        <td className="text-right py-1.5 pl-5">{r.titles}</td>
                        <td className="text-right py-1.5 pl-5 font-[var(--font-mono)]">{formatDuration(r.minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-3">
                * Año en curso. La barra cuenta títulos únicos terminados; las relecturas se ven en la columna <b>Lecturas</b>.
              </p>
            </Card>
          )}
        </>
      )}

      {/* Finish / log modal */}
      {modal && (
        <ReadingModal
          state={modal}
          onClose={() => setModal(null)}
          onFinish={async (finishedAt, rating) => {
            if (modal.kind === 'finish') {
              await readings.finish.mutateAsync({ id: modal.reading.id, finishedAt, rating });
            }
            setModal(null);
          }}
          onLog={async (startedAt, finishedAt, rating) => {
            if (modal.kind === 'log') {
              await readings.logCompleted.mutateAsync({ bookId: modal.book.id, roundNumber: modal.nextRound, startedAt, finishedAt, rating });
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function LibraryRing({ enCurso, terminado, sinEmpezar, total }: { enCurso: number; terminado: number; sinEmpezar: number; total: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const segs = [
    { v: terminado, color: 'var(--color-success)', label: 'Terminados' },
    { v: enCurso, color: 'var(--color-accent)', label: 'En curso' },
    { v: sinEmpezar, color: 'var(--color-border)', label: 'Sin empezar' },
  ];
  const denom = total || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-32 h-32 shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--color-border)" strokeWidth="16" />
          {segs.map((s, i) => {
            const len = (s.v / denom) * C;
            const dash = `${len} ${C - len}`;
            const el = (
              <circle
                key={i}
                cx="64" cy="64" r={R} fill="none" stroke={s.color} strokeWidth="16"
                strokeDasharray={dash} strokeDashoffset={-offset}
                transform="rotate(-90 64 64)"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <b className="text-[1.7rem] font-bold leading-none block">{total}</b>
            <span className="text-[11px] text-[var(--color-text-muted)]">libros</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="w-3 h-3 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
            <b className="ml-auto font-bold">{s.v}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingModal({
  state,
  onClose,
  onFinish,
  onLog,
}: {
  state: NonNullable<{ kind: 'finish'; book: Book; reading: BookReading } | { kind: 'log'; book: Book; nextRound: number }>;
  onClose: () => void;
  onFinish: (finishedAt: string, rating: number | null) => Promise<void>;
  onLog: (startedAt: string, finishedAt: string, rating: number | null) => Promise<void>;
}) {
  const isLog = state.kind === 'log';
  const [startedAt, setStartedAt] = useState(isLog ? todayISO() : (state as any).reading?.started_at ?? todayISO());
  const [finishedAt, setFinishedAt] = useState(todayISO());
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (finishedAt < startedAt) { setErr('La fecha de fin no puede ser anterior al inicio'); return; }
    setErr('');
    setBusy(true);
    try {
      if (isLog) await onLog(startedAt, finishedAt, rating || null);
      else await onFinish(finishedAt, rating || null);
    } catch {
      setErr('Error guardando');
      setBusy(false);
    }
  };

  const title = isLog ? `Registrar lectura · ${state.book.title}` : `Marcar terminado · ${state.book.title}`;

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-4">
        {err && <div className="alert-danger text-sm">{err}</div>}
        {isLog && (
          <label className="block">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Fecha de inicio</span>
            <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
              className="mt-1.5 w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Fecha de finalización</span>
          <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)}
            className="mt-1.5 w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
        </label>
        <div>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Valoración</span>
          <div className="mt-1.5"><StarRating value={rating} onChange={setRating} /></div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} loading={busy} icon={<CheckCircle2 size={16} />}>
            {isLog ? 'Registrar' : 'Marcar terminado'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

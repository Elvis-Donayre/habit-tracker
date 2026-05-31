import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { useBooks } from '@/hooks/useBooks';
import { useSessions } from '@/hooks/useSessions';
import { usePomodoro, type PomodoroSettings, type PomodoroPhase } from '@/hooks/usePomodoro';
import type { Book, Activity } from '@/types';
import { formatDuration, getMoodEmoji, getProductivityBars } from '@/lib/helpers';
import {
  Timer, Play, Pause, RotateCcw, SkipForward, ChevronDown,
  CheckCircle, Clock, Infinity, StopCircle, Maximize2, X,
} from 'lucide-react';
import { FlipClock } from '@/components/timer/FlipClock';

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  idle: 'Listo para empezar',
  work: 'Enfoque',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
};

const INFINITE_PHASE_LABEL = 'Concentración profunda';

const DOT_COLORS = ['var(--color-accent)', 'var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];

const moodLabels: Record<number, string> = {
  1: '😢 Mal',
  2: '😕 Regular',
  3: '😐 Bien',
  4: '😊 Muy bien',
  5: '😄 Excelente',
};

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type ViewMode = 'pomodoro' | 'infinite' | 'flip';

export function TimerContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const activities = useActivities(userId);
  const books = useBooks(userId);
  const sessions = useSessions(userId);
  const pomodoro = usePomodoro(userId);
  const activityList = activities.list.data ?? [];
  const bookList = books.list.data ?? [];
  const booksLoading = books.list.isLoading;
  const sessionsData = sessions.list.data ?? [];

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'ring' | 'flip'>('ring');
  const prevPhaseRef = useRef(pomodoro.phase);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prevPhaseRef.current === 'idle' && pomodoro.phase !== 'idle') {
      setShowFullscreen(true);
    }
    if (pomodoro.phase === 'idle' && !pomodoro.sessionCompleted) {
      setShowFullscreen(false);
    }
    prevPhaseRef.current = pomodoro.phase;
  }, [pomodoro.phase, pomodoro.sessionCompleted]);

  // Close activity picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  const selectedActivity = activityList.find((a) => a.id === pomodoro.selectedActivityId);

  useEffect(() => {
    setSelectedBookId('');
    setSelectedBookTitle('');
  }, [pomodoro.selectedActivityId]);

  const showBookPicker = Boolean(
    selectedActivity &&
      (selectedActivity.tipo === 'Lectura' ||
        selectedActivity.name.toLowerCase().includes('lectura') ||
        selectedActivity.name.toLowerCase().includes('libro')),
  );

  const isInfinite = pomodoro.settings.timerMode === 'infinite';
  const activeView: ViewMode = displayMode === 'flip' ? 'flip' : isInfinite ? 'infinite' : 'pomodoro';
  const phaseLabel = isInfinite && pomodoro.phase === 'work' ? INFINITE_PHASE_LABEL : PHASE_LABELS[pomodoro.phase];
  const isTimerActive = pomodoro.phase !== 'idle';

  const circumference = 2 * Math.PI * 132;
  const strokeDashoffset = circumference - (pomodoro.progress / 100) * circumference;

  // ── Today + recent stats from saved sessions ──
  const todayStr = isoDate(new Date());
  const todaySessions = sessionsData.filter((s) => (s.session_date ?? '').slice(0, 10) === todayStr);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const todayCount = todaySessions.length;
  const recentSessions = sessionsData.slice(0, 4);

  const selectView = (view: ViewMode) => {
    setPickerOpen(false);
    if (view === 'flip') {
      setDisplayMode('flip');
      return;
    }
    setDisplayMode('ring');
    pomodoro.updateSettings({ timerMode: view === 'infinite' ? 'infinite' : 'pomodoro' });
  };

  const Tab = ({ id, label, icon }: { id: ViewMode; label: string; icon?: React.ReactNode }) => (
    <button
      onClick={() => selectView(id)}
      className={`px-[18px] py-2 rounded-full text-[13px] font-semibold transition-all duration-150 inline-flex items-center gap-1.5 ${
        activeView === id
          ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[var(--shadow-sm)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      {/* ── Fullscreen immersion overlay ── */}
      {showFullscreen && (
        <ImmersionOverlay
          time={pomodoro.displayTime}
          phaseLabel={phaseLabel}
          activityName={selectedActivity?.name}
          cycleCount={pomodoro.cycleCount}
          totalCycles={pomodoro.settings.totalCycles}
          isInfinite={isInfinite}
          isRunning={pomodoro.isRunning}
          phase={pomodoro.phase}
          canStart={!!pomodoro.selectedActivityId}
          onExit={() => setShowFullscreen(false)}
          onPlay={pomodoro.start}
          onPause={pomodoro.pause}
          onReset={pomodoro.reset}
          onSkip={pomodoro.skip}
          onFinishInfinite={pomodoro.finishInfinite}
          sessionCompleted={pomodoro.sessionCompleted}
          completedSessionId={pomodoro.completedSessionId}
          notesForm={
            pomodoro.sessionCompleted && pomodoro.completedSessionId ? (
              <SessionNotesForm
                sessionId={pomodoro.completedSessionId}
                onSubmit={pomodoro.submitNotes}
                onCancel={pomodoro.skipNotes}
                showBookPicker={showBookPicker}
                books={bookList}
                booksLoading={booksLoading}
                initialBookId={selectedBookId}
                initialBookTitle={selectedBookTitle}
                activityList={activityList.filter((a) => a.id !== pomodoro.selectedActivityId)}
                maxDuration={pomodoro.pendingDurationMinutes}
              />
            ) : null
          }
        />
      )}

      <div className="page-enter max-w-[1080px] mx-auto pb-10">
        {/* ── Header ── */}
        <div className="text-center mb-7">
          <div
            className="w-[46px] h-[46px] rounded-[14px] grid place-items-center mx-auto mb-3.5 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), #F0905F)',
              boxShadow: '0 8px 20px -4px rgba(224,101,59,0.5)',
            }}
          >
            <Timer size={24} />
          </div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight">Sesión de enfoque</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Elige una actividad, ajusta tu ciclo y entra en modo inmersión.
          </p>
        </div>

        {/* ── Mode tabs ── */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex gap-0.5 p-1 rounded-full bg-[var(--color-accent-soft)]">
            <Tab id="pomodoro" label="Pomodoro" />
            <Tab id="infinite" label="Cuenta infinita" icon={<Infinity size={13} />} />
            <Tab id="flip" label="Flip clock" />
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
          {/* ── Main timer card ── */}
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 sm:p-7 flex flex-col items-center"
            style={{ background: 'radial-gradient(130% 100% at 50% 0%, var(--color-accent-soft) 0%, transparent 60%), var(--color-surface)' }}
          >
            {/* Activity chip + picker */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-3.5 py-[7px] rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-[13px] font-semibold transition-colors hover:brightness-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" />
                {selectedActivity ? selectedActivity.name : 'Selecciona una actividad'}
                <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {pickerOpen && (
                <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-64 max-h-72 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-1.5 text-left">
                  {activityList.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)] text-center py-4 px-2">Crea una actividad primero</p>
                  ) : (
                    activityList.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          pomodoro.selectActivity(activity.id);
                          setPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors ${
                          pomodoro.selectedActivityId === activity.id
                            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
                            : 'hover-surface'
                        }`}
                      >
                        {activity.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Book picker (reading activities) */}
            {showBookPicker && (
              <div className="w-full max-w-[320px] mt-4">
                <BookPicker
                  books={bookList}
                  booksLoading={booksLoading}
                  selectedBookId={selectedBookId}
                  selectedBookTitle={selectedBookTitle}
                  onSelectId={setSelectedBookId}
                  onSelectTitle={setSelectedBookTitle}
                />
              </div>
            )}

            {/* Display: ring or flip clock */}
            {activeView === 'flip' ? (
              <div className="my-6 w-full overflow-x-auto scrollbar-none flex justify-center min-h-[260px] items-center">
                <FlipDisplay time={pomodoro.displayTime} size="lg" />
              </div>
            ) : (
              <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] my-6">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <circle cx="150" cy="150" r="132" fill="none" stroke="var(--color-border)" strokeWidth="14" />
                  <circle
                    cx="150"
                    cy="150"
                    r="132"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 150 150)"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[3.4rem] sm:text-[4.4rem] font-bold leading-none tracking-tight tabular-nums font-[var(--font-mono)]">
                    {pomodoro.displayTime}
                  </span>
                  <span className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent)]">
                    {phaseLabel}
                  </span>
                  {!isInfinite && (
                    <div className="flex gap-[7px] mt-3">
                      {Array.from({ length: pomodoro.settings.totalCycles }).map((_, i) => (
                        <span
                          key={i}
                          className="w-[9px] h-[9px] rounded-full transition-all"
                          style={{
                            background: i < pomodoro.cycleCount || i === pomodoro.cycleCount ? 'var(--color-accent)' : 'var(--color-border)',
                            boxShadow: i === pomodoro.cycleCount ? '0 0 0 4px var(--color-accent-soft)' : undefined,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={pomodoro.reset}
                className="w-[52px] h-[52px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] grid place-items-center text-[var(--color-text)] hover-surface transition-all hover:-translate-y-0.5"
                title={isInfinite ? 'Descartar sesión' : 'Reiniciar'}
              >
                <RotateCcw size={20} />
              </button>

              {pomodoro.isRunning ? (
                <button
                  onClick={pomodoro.pause}
                  className="w-[76px] h-[76px] rounded-full bg-[var(--color-accent)] text-white grid place-items-center transition-all hover:-translate-y-0.5 hover:scale-[1.03]"
                  style={{ boxShadow: '0 10px 26px -6px rgba(224,101,59,0.6)' }}
                  title="Pausar"
                >
                  <Pause size={28} />
                </button>
              ) : (
                <button
                  onClick={pomodoro.start}
                  disabled={!pomodoro.selectedActivityId}
                  className="w-[76px] h-[76px] rounded-full bg-[var(--color-accent)] text-white grid place-items-center transition-all hover:-translate-y-0.5 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
                  style={{ boxShadow: '0 10px 26px -6px rgba(224,101,59,0.6)' }}
                  title="Iniciar"
                >
                  <Play size={28} className="ml-1" />
                </button>
              )}

              {isInfinite && pomodoro.phase === 'work' ? (
                <button
                  onClick={pomodoro.finishInfinite}
                  className="w-[52px] h-[52px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] grid place-items-center text-[var(--color-danger)] hover-surface transition-all hover:-translate-y-0.5"
                  title="Finalizar y guardar"
                >
                  <StopCircle size={20} />
                </button>
              ) : (
                <button
                  onClick={pomodoro.skip}
                  disabled={isInfinite || !isTimerActive}
                  className="w-[52px] h-[52px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] grid place-items-center text-[var(--color-text)] hover-surface transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  title="Saltar fase"
                >
                  <SkipForward size={20} />
                </button>
              )}
            </div>

            {!pomodoro.selectedActivityId && (
              <p className="text-xs text-[var(--color-text-muted)] mt-4">Selecciona una actividad para empezar</p>
            )}

            {/* Immersion button */}
            <button
              onClick={() => setShowFullscreen(true)}
              className="mt-6 inline-flex items-center gap-2.5 px-[22px] py-2.5 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <Maximize2 size={17} />
              Entrar en inmersión
            </button>

            {/* Inline completion form (when not in fullscreen) */}
            {!showFullscreen && pomodoro.sessionCompleted && pomodoro.completedSessionId && (
              <div className="w-full mt-6 space-y-3">
                <div className="alert-success flex items-center gap-2 justify-center">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">¡Sesión completada! Registra tus notas</span>
                </div>
                <SessionNotesForm
                  sessionId={pomodoro.completedSessionId}
                  onSubmit={pomodoro.submitNotes}
                  onCancel={pomodoro.skipNotes}
                  showBookPicker={showBookPicker}
                  books={bookList}
                  booksLoading={booksLoading}
                  initialBookId={selectedBookId}
                  initialBookTitle={selectedBookTitle}
                  activityList={activityList.filter((a) => a.id !== pomodoro.selectedActivityId)}
                  maxDuration={pomodoro.pendingDurationMinutes}
                />
              </div>
            )}
          </div>

          {/* ── Side column ── */}
          <div className="flex flex-col gap-5">
            {/* Settings */}
            <SideCard label="Configuración del ciclo">
              <div className="mt-1">
                <SettingRow label="Enfoque" hint="duración de trabajo">
                  <Stepper
                    value={`${pomodoro.settings.workMinutes} m`}
                    onDec={() => pomodoro.updateSettings({ workMinutes: Math.max(1, pomodoro.settings.workMinutes - 5) })}
                    onInc={() => pomodoro.updateSettings({ workMinutes: Math.min(120, pomodoro.settings.workMinutes + 5) })}
                  />
                </SettingRow>
                <SettingRow label="Pausa corta" hint="entre ciclos">
                  <Stepper
                    value={`${pomodoro.settings.breakMinutes} m`}
                    onDec={() => pomodoro.updateSettings({ breakMinutes: Math.max(1, pomodoro.settings.breakMinutes - 1) })}
                    onInc={() => pomodoro.updateSettings({ breakMinutes: Math.min(30, pomodoro.settings.breakMinutes + 1) })}
                  />
                </SettingRow>
                <SettingRow label="Pausa larga" hint="cada varios ciclos">
                  <Stepper
                    value={`${pomodoro.settings.longBreakMinutes} m`}
                    onDec={() => pomodoro.updateSettings({ longBreakMinutes: Math.max(1, pomodoro.settings.longBreakMinutes - 5) })}
                    onInc={() => pomodoro.updateSettings({ longBreakMinutes: Math.min(60, pomodoro.settings.longBreakMinutes + 5) })}
                  />
                </SettingRow>
                <SettingRow label="Ciclos" hint="por sesión">
                  <Stepper
                    value={`${pomodoro.settings.totalCycles}`}
                    onDec={() => pomodoro.updateSettings({ totalCycles: Math.max(1, pomodoro.settings.totalCycles - 1) })}
                    onInc={() => pomodoro.updateSettings({ totalCycles: Math.min(12, pomodoro.settings.totalCycles + 1) })}
                  />
                </SettingRow>
                <SettingRow label="Sonido al terminar">
                  <Switch on={pomodoro.settings.soundEnabled} onClick={() => pomodoro.updateSettings({ soundEnabled: !pomodoro.settings.soundEnabled })} />
                </SettingRow>
                <SettingRow label="Auto-iniciar pausa" hint="al terminar enfoque">
                  <Switch on={pomodoro.settings.autoStartBreak} onClick={() => pomodoro.updateSettings({ autoStartBreak: !pomodoro.settings.autoStartBreak })} />
                </SettingRow>
              </div>
            </SideCard>

            {/* Today stats */}
            <SideCard label="Hoy">
              <div className="grid grid-cols-2 gap-4 mt-3">
                <StatMini
                  icon={<Clock size={18} />}
                  iconBg="var(--color-accent-soft)"
                  iconFg="var(--color-accent)"
                  value={todayMinutes > 0 ? formatDuration(todayMinutes) : '0m'}
                  label="enfocado"
                />
                <StatMini
                  icon={<CheckCircle size={18} />}
                  iconBg="var(--color-success-soft)"
                  iconFg="var(--color-success)"
                  value={`${todayCount}`}
                  label={todayCount === 1 ? 'sesión' : 'sesiones'}
                />
              </div>
            </SideCard>

            {/* Recent sessions */}
            <SideCard label="Sesiones recientes">
              <div className="mt-1.5">
                {recentSessions.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">Aún no hay sesiones registradas</p>
                ) : (
                  recentSessions.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-center gap-2.5 py-2.5 border-b border-[var(--color-border)] last:border-0 text-[13px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                      <span className="flex-1 font-medium truncate">{s.activities?.name ?? 'Sesión'}</span>
                      <span className="text-[var(--color-text-muted)] font-[var(--font-mono)]">{s.duration_minutes ?? 0} min</span>
                    </div>
                  ))
                )}
              </div>
            </SideCard>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">{label}</span>
      {children}
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0 gap-3">
      <div className="text-sm font-medium">
        {label}
        {hint && <small className="block text-xs text-[var(--color-text-muted)] font-normal mt-0.5">{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, onDec, onInc }: { value: string; onDec: () => void; onInc: () => void }) {
  return (
    <div className="inline-flex items-center border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden shrink-0">
      <button onClick={onDec} className="w-8 h-[34px] text-lg leading-none bg-[var(--color-surface)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-colors">−</button>
      <span className="w-[52px] text-center text-sm font-semibold font-[var(--font-mono)]">{value}</span>
      <button onClick={onInc} className="w-8 h-[34px] text-lg leading-none bg-[var(--color-surface)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-colors">+</button>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-[42px] h-6 rounded-full transition-colors shrink-0"
      style={{ background: on ? 'var(--color-accent)' : 'var(--color-border)' }}
      role="switch"
      aria-checked={on}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
        style={on ? { right: 3 } : { left: 3 }}
      />
    </button>
  );
}

function StatMini({ icon, iconBg, iconFg, value, label }: { icon: React.ReactNode; iconBg: string; iconFg: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[38px] h-[38px] rounded-[var(--radius-md)] grid place-items-center shrink-0" style={{ background: iconBg, color: iconFg }}>
        {icon}
      </div>
      <div>
        <div className="text-[1.4rem] font-extrabold tracking-tight leading-none font-[var(--font-mono)]">{value}</div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/** Static flip-style time display matching the mockup (dark digit boxes with a center seam). */
function FlipDisplay({ time, size = 'lg' }: { time: string; size?: 'lg' | 'sm' }) {
  const digitCls =
    size === 'lg'
      ? 'text-[2.6rem] sm:text-[3.2rem] px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-[12px]'
      : 'text-[2.4rem] px-3 py-2.5 rounded-[10px]';
  const colonCls = size === 'lg' ? 'text-[2.4rem] sm:text-[2.8rem]' : 'text-[2.2rem]';
  return (
    <div className="inline-flex items-center gap-1.5">
      {time.split('').map((ch, i) =>
        ch === ':' ? (
          <span key={i} className={`${colonCls} font-bold text-[var(--color-text-muted)]`}>:</span>
        ) : (
          <span
            key={i}
            className={`relative font-bold font-[var(--font-mono)] text-[var(--color-bg)] shadow-[var(--shadow-md)] ${digitCls}`}
            style={{ background: 'var(--color-text)' }}
          >
            {ch}
            <span className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
          </span>
        ),
      )}
    </div>
  );
}

/* ───────────────────────── Immersion overlay ───────────────────────── */

function ImmersionOverlay({
  time, phaseLabel, activityName, cycleCount, totalCycles, isInfinite, isRunning, phase, canStart,
  onExit, onPlay, onPause, onReset, onSkip, onFinishInfinite, sessionCompleted, completedSessionId, notesForm,
}: {
  time: string;
  phaseLabel: string;
  activityName?: string;
  cycleCount: number;
  totalCycles: number;
  isInfinite: boolean;
  isRunning: boolean;
  phase: PomodoroPhase;
  canStart: boolean;
  onExit: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onFinishInfinite: () => void;
  sessionCompleted: boolean;
  completedSessionId: string | null;
  notesForm: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onExit]);

  const showSkip = !isInfinite && (phase === 'work' || phase === 'short_break' || phase === 'long_break');
  const showFinish = isInfinite && phase === 'work';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(60% 60% at 50% 38%, rgba(224,101,59,0.16) 0%, transparent 70%), #120D09',
        color: '#F5EDE4',
        overflow: 'auto',
        animation: 'fullscreenIn 0.4s ease-out',
      }}
    >
      {/* Breathing glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 'min(760px, 90vmin)',
          height: 'min(760px, 90vmin)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(224,101,59,0.18) 0%, transparent 65%)',
          filter: 'blur(8px)',
          animation: 'breathe 7s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Exit */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute', top: 28, right: 32, display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,237,228,0.15)',
          color: 'rgba(245,237,228,0.8)', padding: '9px 16px', borderRadius: 999,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <X size={14} strokeWidth={2.5} />
        Salir
      </button>

      {!sessionCompleted && (
        <>
          {activityName && (
            <div style={{ position: 'relative', fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,237,228,0.6)', marginBottom: 26 }}>
              {activityName}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <FlipClock time={time} />
          </div>

          <div style={{ position: 'relative', marginTop: 18, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>
            {phaseLabel}
            {!isInfinite && phase !== 'idle' && ` · ciclo ${cycleCount + 1} de ${totalCycles}`}
          </div>

          {!isInfinite && (
            <div style={{ position: 'relative', marginTop: 30, display: 'flex', gap: 9 }}>
              {Array.from({ length: totalCycles }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: i < cycleCount || i === cycleCount ? 'var(--color-accent)' : 'rgba(245,237,228,0.2)',
                    boxShadow: i === cycleCount ? '0 0 0 5px rgba(224,101,59,0.2)' : undefined,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div style={{ position: 'relative', display: 'flex', gap: 18, marginTop: 50 }}>
            <ImmButton onClick={onReset} title="Reiniciar"><RotateCcw size={20} /></ImmButton>
            {isRunning ? (
              <ImmButton primary onClick={onPause} title="Pausar"><Pause size={24} /></ImmButton>
            ) : (
              <ImmButton primary onClick={onPlay} disabled={!canStart} title="Iniciar"><Play size={24} style={{ marginLeft: 3 }} /></ImmButton>
            )}
            {showFinish ? (
              <ImmButton onClick={onFinishInfinite} title="Finalizar"><StopCircle size={20} /></ImmButton>
            ) : (
              <ImmButton onClick={onSkip} disabled={!showSkip} title="Saltar"><SkipForward size={20} /></ImmButton>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: 34, fontSize: 12, color: 'rgba(245,237,228,0.4)', letterSpacing: '0.05em' }}>
            El fondo respira con tu sesión · pulsa Esc o "Salir" para volver
          </div>
        </>
      )}

      {sessionCompleted && completedSessionId && (
        <div style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}>
          <div className="alert-success" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>¡Sesión completada! Registra tus notas</span>
          </div>
          {notesForm}
        </div>
      )}
    </div>
  );
}

function ImmButton({ children, onClick, primary, disabled, title }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: primary ? 72 : 54,
        height: primary ? 72 : 54,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: '#F5EDE4',
        border: primary ? 'none' : '1px solid rgba(245,237,228,0.18)',
        background: primary ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
        boxShadow: primary ? '0 12px 30px -6px rgba(224,101,59,0.6)' : undefined,
        backdropFilter: primary ? undefined : 'blur(6px)',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Book picker ───────────────────────── */

function BookPicker({
  books, booksLoading, selectedBookId, selectedBookTitle, onSelectId, onSelectTitle,
}: {
  books: Book[];
  booksLoading: boolean;
  selectedBookId: string;
  selectedBookTitle: string;
  onSelectId: (v: string) => void;
  onSelectTitle: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium block mb-1.5">Libro</label>
      {booksLoading ? (
        <p className="text-xs text-[var(--color-text-muted)] py-1">Cargando biblioteca...</p>
      ) : books.length > 0 ? (
        <div className="space-y-2">
          <select
            value={selectedBookId}
            onChange={(e) => {
              const val = e.target.value;
              onSelectId(val);
              if (val === 'custom' || val === '') onSelectTitle('');
              else onSelectTitle(books.find((b) => b.id === val)?.title ?? '');
            }}
          >
            <option value="">-- Seleccionar libro --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}{b.author ? ` — ${b.author}` : ''}
              </option>
            ))}
            <option value="custom">Otro título...</option>
          </select>
          {selectedBookId === 'custom' && (
            <input
              type="text"
              value={selectedBookTitle}
              onChange={(e) => onSelectTitle(e.target.value)}
              placeholder="Escribe el título del libro"
            />
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <input
            type="text"
            value={selectedBookTitle}
            onChange={(e) => onSelectTitle(e.target.value)}
            placeholder="¿Qué libro vas a leer?"
          />
          <p className="text-[11px] text-[var(--color-text-muted)]">Agrega libros en Sesiones → Biblioteca para seleccionarlos aquí.</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Session notes form ───────────────────────── */

function SessionNotesForm({
  sessionId,
  onSubmit,
  onCancel,
  showBookPicker = false,
  books = [],
  booksLoading = false,
  initialBookId = '',
  initialBookTitle = '',
  activityList = [],
  maxDuration = 0,
}: {
  sessionId: string;
  onSubmit: (data: { sessionId: string; notes: string; mood: number; productivity: number; bookTitle?: string; englishMinutes?: number; englishActivityId?: string }) => void;
  onCancel: () => void;
  showBookPicker?: boolean;
  books?: Book[];
  booksLoading?: boolean;
  initialBookId?: string;
  initialBookTitle?: string;
  activityList?: Activity[];
  maxDuration?: number;
}) {
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [bookId, setBookId] = useState(initialBookId);
  const [bookTitle, setBookTitle] = useState(initialBookTitle);
  const [englishMinutes, setEnglishMinutes] = useState<number | ''>('');
  const [englishActivityId, setEnglishActivityId] = useState('');

  return (
    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-left space-y-4">
      {showBookPicker && (
        <div>
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Libro</label>
          {booksLoading ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] py-1">Cargando biblioteca...</p>
          ) : books.length > 0 ? (
            <div className="mt-1 space-y-2">
              <select
                value={bookId}
                onChange={(e) => {
                  const val = e.target.value;
                  setBookId(val);
                  if (val === 'custom' || val === '') setBookTitle('');
                  else setBookTitle(books.find((b) => b.id === val)?.title ?? '');
                }}
              >
                <option value="">-- Seleccionar libro --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}{b.author ? ` — ${b.author}` : ''}
                  </option>
                ))}
                <option value="custom">Otro título...</option>
              </select>
              {bookId === 'custom' && (
                <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="Escribe el título del libro" />
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-1.5">
              <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="¿Qué libro estabas leyendo?" />
              <p className="text-[11px] text-[var(--color-text-muted)]">Agrega libros en Sesiones → Biblioteca para seleccionarlos aquí.</p>
            </div>
          )}
        </div>
      )}
      {activityList.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium block">
            ¿Minutos en inglés? <span className="normal-case">(opcional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={englishMinutes}
              onChange={(e) => setEnglishMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              min={1}
              max={maxDuration || undefined}
              placeholder="—"
              className="font-[var(--font-mono)]"
            />
            <select value={englishActivityId} onChange={(e) => setEnglishActivityId(e.target.value)}>
              <option value="">-- Actividad --</option>
              {activityList.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          {englishMinutes !== '' && englishMinutes > 0 && englishActivityId && (
            <p className="text-[11px] text-[var(--color-text-muted)]">
              💡 +{englishMinutes} min en &quot;{activityList.find((a) => a.id === englishActivityId)?.name}&quot;
            </p>
          )}
        </div>
      )}
      <div>
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Qué lograste? ¿Qué aprendiste?"
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div>
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium mb-2 block">¿Cómo te sentiste?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setMood(value)}
              className={`flex-1 py-3 text-sm rounded-[var(--radius-md)] transition-all duration-150 ${
                mood === value
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-2 border-[var(--color-accent)] font-medium scale-105'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover-surface'
              }`}
            >
              {getMoodEmoji(value)}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 text-center">{moodLabels[mood]}</p>
      </div>
      <div>
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium mb-2 block">Productividad</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setProductivity(value)}
              className={`flex-1 py-3 text-sm rounded-[var(--radius-md)] transition-all duration-150 ${
                productivity === value
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-2 border-[var(--color-accent)] font-medium scale-105'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover-surface'
              }`}
            >
              {getProductivityBars(value)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({
            sessionId,
            notes,
            mood,
            productivity,
            bookTitle: bookTitle.trim() || undefined,
            englishMinutes: englishMinutes !== '' && englishMinutes > 0 ? englishMinutes : undefined,
            englishActivityId: englishActivityId || undefined,
          })}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-white rounded-[var(--radius-md)] transition-all duration-150 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <CheckCircle size={16} />
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-3.5 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
        >
          Omitir
        </button>
      </div>
    </div>
  );
}

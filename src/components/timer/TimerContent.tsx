import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { useBooks } from '@/hooks/useBooks';
import { usePomodoro, type PomodoroSettings, type PomodoroPhase } from '@/hooks/usePomodoro';
import type { Book, Activity } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatDuration, getMoodEmoji, getProductivityBars } from '@/lib/helpers';
import {
  Timer, Play, Pause, RotateCcw, SkipForward, Settings,
  ChevronDown, ChevronUp, CheckCircle, Clock, Zap, Infinity, StopCircle, Minimize2, Maximize2,
} from 'lucide-react';
import { FlipClock } from '@/components/timer/FlipClock';

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  idle: 'var(--color-accent)',
  work: 'var(--color-danger)',
  short_break: 'var(--color-success)',
  long_break: 'var(--color-info)',
};

const FULLSCREEN_PHASE_COLORS: Record<PomodoroPhase, string> = {
  idle: '#6366f1',
  work: '#ef4444',
  short_break: '#22c55e',
  long_break: '#38bdf8',
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  idle: 'Listo para empezar',
  work: 'Trabajo',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
};

const INFINITE_PHASE_LABEL = 'Concentración profunda';

const moodLabels: Record<number, string> = {
  1: '😢 Mal',
  2: '😕 Regular',
  3: '😐 Bien',
  4: '😊 Muy bien',
  5: '😄 Excelente',
};

export function TimerContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const activities = useActivities(userId);
  const books = useBooks(userId);
  const pomodoro = usePomodoro(userId);
  const activityList = activities.list.data ?? [];
  const bookList = books.list.data ?? [];
  const booksLoading = books.list.isLoading;

  const [showSettings, setShowSettings] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const prevPhaseRef = useRef(pomodoro.phase);

  useEffect(() => {
    if (prevPhaseRef.current === 'idle' && pomodoro.phase !== 'idle') {
      setShowFullscreen(true);
    }
    if (pomodoro.phase === 'idle' && !pomodoro.sessionCompleted) {
      setShowFullscreen(false);
    }
    prevPhaseRef.current = pomodoro.phase;
  }, [pomodoro.phase, pomodoro.sessionCompleted]);

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
  const phaseColor = isInfinite ? 'var(--color-accent)' : PHASE_COLORS[pomodoro.phase];
  const fsPhaseColor = isInfinite ? '#818cf8' : FULLSCREEN_PHASE_COLORS[pomodoro.phase];
  const phaseLabel = isInfinite && pomodoro.phase === 'work'
    ? INFINITE_PHASE_LABEL
    : PHASE_LABELS[pomodoro.phase];

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (pomodoro.progress / 100) * circumference;

  const isTimerActive = pomodoro.phase !== 'idle';

  return (
    <>
    {/* ── Fullscreen flip-clock overlay ── */}
    {showFullscreen && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: '#080809',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(16px, 3vh, 36px)',
          padding: 'clamp(16px, 4vw, 48px)',
          animation: 'fullscreenIn 0.25s ease-out',
          overflowY: 'auto',
        }}
      >
        {/* Minimize button */}
        <button
          onClick={() => setShowFullscreen(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#888',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          title="Minimizar"
        >
          <Minimize2 size={18} />
        </button>

        {/* Phase label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: fsPhaseColor }} />
          <span
            style={{
              fontSize: 'clamp(11px, 1.8vmin, 14px)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: fsPhaseColor,
            }}
          >
            {phaseLabel}
          </span>
        </div>

        {/* Flip clock */}
        <FlipClock time={pomodoro.displayTime} />

        {/* Activity + cycle info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {selectedActivity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="#444" />
              <span style={{ fontSize: 'clamp(12px, 1.8vmin, 15px)', color: '#505058' }}>
                {selectedActivity.name}
              </span>
            </div>
          )}
          {!isInfinite && (
            <span style={{ fontSize: 'clamp(11px, 1.6vmin, 13px)', color: '#3a3a42' }}>
              Ciclo {pomodoro.cycleCount + 1} de {pomodoro.settings.totalCycles}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vmin, 20px)' }}>
          <button
            onClick={pomodoro.reset}
            style={{
              width: 'clamp(44px, 8vmin, 56px)',
              height: 'clamp(44px, 8vmin, 56px)',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reiniciar"
          >
            <RotateCcw size={18} />
          </button>

          {pomodoro.isRunning ? (
            <button
              onClick={pomodoro.pause}
              style={{
                width: 'clamp(64px, 12vmin, 80px)',
                height: 'clamp(64px, 12vmin, 80px)',
                borderRadius: '50%',
                background: fsPhaseColor,
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 32px ${fsPhaseColor}55`,
              }}
            >
              <Pause size={28} />
            </button>
          ) : (
            <button
              onClick={pomodoro.start}
              disabled={!pomodoro.selectedActivityId}
              style={{
                width: 'clamp(64px, 12vmin, 80px)',
                height: 'clamp(64px, 12vmin, 80px)',
                borderRadius: '50%',
                background: pomodoro.selectedActivityId ? fsPhaseColor : '#2a2a2e',
                border: 'none',
                color: 'white',
                cursor: pomodoro.selectedActivityId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: pomodoro.selectedActivityId ? `0 0 32px ${fsPhaseColor}55` : 'none',
              }}
            >
              <Play size={28} style={{ marginLeft: 3 }} />
            </button>
          )}

          {!isInfinite && (pomodoro.phase === 'work' || pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break') && (
            <button
              onClick={pomodoro.skip}
              style={{
                width: 'clamp(44px, 8vmin, 56px)',
                height: 'clamp(44px, 8vmin, 56px)',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Saltar fase"
            >
              <SkipForward size={18} />
            </button>
          )}
          {isInfinite && pomodoro.phase === 'work' && (
            <button
              onClick={pomodoro.finishInfinite}
              style={{
                width: 'clamp(44px, 8vmin, 56px)',
                height: 'clamp(44px, 8vmin, 56px)',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Finalizar y guardar"
            >
              <StopCircle size={18} />
            </button>
          )}
        </div>

        {/* Post-session notes form */}
        {pomodoro.sessionCompleted && pomodoro.completedSessionId && (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <div
              className="alert-success"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CheckCircle size={16} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>¡Sesión completada! Registra tus notas</span>
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
    )}

    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.65rem] font-bold tracking-tight flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
            <Timer size={18} className="text-[var(--color-accent)]" />
          </span>
          Temporizador
        </h1>
        <div className="flex items-center gap-2">
          {isTimerActive && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
              title="Ver en pantalla completa"
            >
              <Maximize2 size={14} />
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
          >
            <Settings size={14} />
            Configuración
            {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {showSettings && (
        <TimerSettings
          settings={pomodoro.settings}
          onUpdate={pomodoro.updateSettings}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-1 mb-5">
                <button
                  onClick={() => pomodoro.updateSettings({ timerMode: 'pomodoro' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                    !isInfinite
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover-surface'
                  }`}
                >
                  Pomodoro
                </button>
                <button
                  onClick={() => pomodoro.updateSettings({ timerMode: 'infinite' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 flex items-center gap-1.5 ${
                    isInfinite
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover-surface'
                  }`}
                >
                  <Infinity size={12} />
                  Foco profundo
                </button>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phaseColor }} />
                <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: phaseColor }}>
                  {phaseLabel}
                </span>
              </div>

              <div className="relative w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] mb-6">
                <svg viewBox="0 0 300 300" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="150"
                    cy="150"
                    r="140"
                    stroke="var(--color-border)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="150"
                    cy="150"
                    r="140"
                    stroke={phaseColor}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tabular-nums tracking-tight">
                    {pomodoro.displayTime}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)] mt-1">
                    {isInfinite ? (pomodoro.phase === 'work' ? 'En sesión' : 'Listo') : `Ciclo ${pomodoro.cycleCount + 1}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {pomodoro.isRunning ? (
                  <button
                    onClick={pomodoro.pause}
                    className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center hover-surface transition-colors"
                  >
                    <Pause size={20} className="text-[var(--color-text)]" />
                  </button>
                ) : (
                  <button
                    onClick={pomodoro.start}
                    disabled={!pomodoro.selectedActivityId}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: phaseColor }}
                  >
                    <Play size={24} className="text-white ml-1" />
                  </button>
                )}
                <button
                  onClick={pomodoro.reset}
                  className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover-surface transition-colors"
                  title={isInfinite ? 'Descartar sesión' : 'Reiniciar'}
                >
                  <RotateCcw size={16} className="text-[var(--color-text-muted)]" />
                </button>
                {!isInfinite && (pomodoro.phase === 'work' || pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break') && (
                  <button
                    onClick={pomodoro.skip}
                    className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover-surface transition-colors"
                  >
                    <SkipForward size={16} className="text-[var(--color-text-muted)]" />
                  </button>
                )}
                {isInfinite && pomodoro.phase === 'work' && (
                  <button
                    onClick={pomodoro.finishInfinite}
                    className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover-surface transition-colors"
                    title="Finalizar y guardar sesión"
                  >
                    <StopCircle size={16} className="text-[var(--color-danger)]" />
                  </button>
                )}
              </div>

              {pomodoro.selectedActivityId && selectedActivity && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Zap size={14} className="text-[var(--color-accent)]" />
                  <span>{selectedActivity.name}</span>
                </div>
              )}

              {!pomodoro.selectedActivityId && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Selecciona una actividad para empezar
                </p>
              )}

              {pomodoro.sessionCompleted && pomodoro.completedSessionId && (
                <div className="w-full mt-6 space-y-4">
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
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-accent)]" />
              Seleccionar actividad
            </h3>
            <div className="space-y-2">
              {activityList.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
                  Crea una actividad primero
                </p>
              ) : (
                activityList.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => pomodoro.selectActivity(activity.id)}
                    className={`w-full text-left px-3 py-3 rounded-[var(--radius-md)] text-sm transition-colors ${
                      pomodoro.selectedActivityId === activity.id
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium border border-[var(--color-accent)]/20'
                        : 'hover-surface border border-transparent'
                    }`}
                  >
                    {activity.name}
                  </button>
                ))
              )}
            </div>
            {showBookPicker && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium block mb-1.5">
                  Libro
                </label>
                {booksLoading ? (
                  <p className="text-xs text-[var(--color-text-muted)] py-1">Cargando biblioteca...</p>
                ) : bookList.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedBookId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBookId(val);
                        if (val === 'custom' || val === '') {
                          setSelectedBookTitle('');
                        } else {
                          const found = bookList.find((b) => b.id === val);
                          setSelectedBookTitle(found?.title ?? '');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
                    >
                      <option value="">-- Seleccionar libro --</option>
                      {bookList.map((b) => (
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
                        onChange={(e) => setSelectedBookTitle(e.target.value)}
                        placeholder="Escribe el título del libro"
                        className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={selectedBookTitle}
                      onChange={(e) => setSelectedBookTitle(e.target.value)}
                      placeholder="¿Qué libro vas a leer?"
                      className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
                    />
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Agrega libros en Sesiones → Biblioteca para seleccionarlos aquí.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {!isInfinite && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Ciclos hoy</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: pomodoro.settings.totalCycles }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < pomodoro.cycleCount
                        ? 'bg-[var(--color-accent)] text-white'
                        : i === pomodoro.cycleCount
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-2 border-[var(--color-accent)]'
                        : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                {pomodoro.cycleCount} de {pomodoro.settings.totalCycles} completados
              </p>
            </Card>
          )}

          {isInfinite && pomodoro.phase === 'work' && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Infinity size={14} className="text-[var(--color-accent)]" />
                Tiempo en sesión
              </h3>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-accent)]">
                {pomodoro.displayTime}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Sesión activa</p>
            </Card>
          )}

          {pomodoro.totalFocusTime > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Tiempo enfocado hoy</h3>
              <p className="text-2xl font-bold text-[var(--color-accent)]">
                {formatDuration(Math.floor(pomodoro.totalFocusTime / 60))}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function TimerSettings({ settings, onUpdate }: { settings: PomodoroSettings; onUpdate: (s: Partial<PomodoroSettings>) => void }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">Configuración del temporizador</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Trabajo (min)</label>
          <input
            type="number"
            value={settings.workMinutes}
            onChange={(e) => onUpdate({ workMinutes: Number(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
            min={1}
            max={120}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Descanso corto (min)</label>
          <input
            type="number"
            value={settings.breakMinutes}
            onChange={(e) => onUpdate({ breakMinutes: Number(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
            min={1}
            max={30}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Descanso largo (min)</label>
          <input
            type="number"
            value={settings.longBreakMinutes}
            onChange={(e) => onUpdate({ longBreakMinutes: Number(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
            min={1}
            max={60}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Ciclos totales</label>
          <input
            type="number"
            value={settings.totalCycles}
            onChange={(e) => onUpdate({ totalCycles: Number(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
            min={1}
            max={12}
          />
        </div>
      </div>
    </Card>
  );
}

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
                  if (val === 'custom' || val === '') {
                    setBookTitle('');
                  } else {
                    const found = books.find((b) => b.id === val);
                    setBookTitle(found?.title ?? '');
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
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
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Escribe el título del libro"
                  className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
                />
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-1.5">
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="¿Qué libro estabas leyendo?"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
              />
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Agrega libros en Sesiones → Biblioteca para seleccionarlos aquí.
              </p>
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
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors font-[var(--font-mono)]"
            />
            <select
              value={englishActivityId}
              onChange={(e) => setEnglishActivityId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
            >
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
          className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors resize-none"
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

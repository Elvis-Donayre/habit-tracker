import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { usePomodoro, type PomodoroSettings, type PomodoroPhase } from '@/hooks/usePomodoro';
import { Card } from '@/components/ui/Card';
import { formatDuration, getMoodEmoji, getProductivityBars } from '@/lib/helpers';
import {
  Timer, Play, Pause, RotateCcw, SkipForward, Settings, Volume2, VolumeX,
  ChevronDown, ChevronUp, CheckCircle, Clock, Zap,
} from 'lucide-react';

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  idle: 'var(--color-accent)',
  work: 'var(--color-danger)',
  short_break: 'var(--color-success)',
  long_break: 'var(--color-info)',
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  idle: 'Listo para empezar',
  work: 'Trabajo',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
};

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
  const pomodoro = usePomodoro(userId);
  const activityList = activities.list.data ?? [];

  const [showSettings, setShowSettings] = useState(false);

  const selectedActivity = activityList.find((a) => a.id === pomodoro.selectedActivityId);
  const phaseColor = PHASE_COLORS[pomodoro.phase];

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (pomodoro.progress / 100) * circumference;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Timer size={24} className="text-[var(--color-accent)]" />
          Temporizador
        </h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
        >
          <Settings size={14} />
          Configuración
          {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showSettings && (
        <TimerSettings
          settings={pomodoro.settings}
          onUpdate={pomodoro.updateSettings}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phaseColor }} />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: phaseColor }}>
                {PHASE_LABELS[pomodoro.phase]}
              </span>
            </div>

            <div className="relative w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] mx-auto mb-6">
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
                  Ciclo {pomodoro.cycleCount + 1}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
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
              >
                <RotateCcw size={16} className="text-[var(--color-text-muted)]" />
              </button>
              {(pomodoro.phase === 'work' || pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break') && (
                <button
                  onClick={pomodoro.skip}
                  className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover-surface transition-colors"
                >
                  <SkipForward size={16} className="text-[var(--color-text-muted)]" />
                </button>
              )}
            </div>

            {pomodoro.selectedActivityId && selectedActivity && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Zap size={14} className="text-[var(--color-accent)]" />
                <span>{selectedActivity.name}</span>
              </div>
            )}

            {pomodoro.sessionCompleted && pomodoro.completedSessionId && (
              <div className="mt-6 space-y-4">
                <div className="alert-success flex items-center gap-2 justify-center">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">¡Sesión completada! Registra tus notas</span>
                </div>
                <SessionNotesForm
                  sessionId={pomodoro.completedSessionId}
                  onSubmit={pomodoro.submitNotes}
                  onCancel={pomodoro.skipNotes}
                />
              </div>
            )}
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
          </Card>

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
}: {
  sessionId: string;
  onSubmit: (data: { sessionId: string; notes: string; mood: number; productivity: number; bookTitle?: string }) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [bookTitle, setBookTitle] = useState('');

  return (
    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-left space-y-4">
      <div>
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Libro (opcional)</label>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          placeholder="¿Qué libro estabas leyendo?"
          className="mt-1 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
        />
      </div>
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
          onClick={() => onSubmit({ sessionId, notes, mood, productivity, bookTitle: bookTitle.trim() || undefined })}
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

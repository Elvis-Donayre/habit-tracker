import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { useActivities } from '@/hooks/useActivities';
import { Tabs } from '@/components/ui/Tabs';
import { Card, MetricCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatDuration, calculateWeeksToGoal, categorizeCompletion } from '@/lib/helpers';
import { Plus, List, Target, Edit2, Pause, Play, Trash2, Zap, Clock } from 'lucide-react';

export function HabitsContent() {
  const { user } = useAuth();
  const userId = user?.id!;
  const habits = useHabits(userId);

  return (
    <div className="space-y-6">
      <h1 className="text-[1.65rem] font-bold tracking-tight flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
          <Target size={18} className="text-[var(--color-accent)]" />
        </span>
        Mis Hábitos
      </h1>

      <Tabs
        tabs={[
          { id: 'create', label: 'Crear Hábito', icon: <Plus size={16} /> },
          { id: 'list', label: 'Mis Hábitos', icon: <List size={16} /> },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === 'create' && <CreateHabitForm userId={userId} habits={habits} />}
            {activeTab === 'list' && <HabitList userId={userId} habits={habits} />}
          </>
        )}
      </Tabs>
    </div>
  );
}

function CreateHabitForm({ userId, habits }: { userId: string; habits: ReturnType<typeof useHabits> }) {
  const activities = useActivities(userId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [initialActivity, setInitialActivity] = useState('');
  const [targetWeekly, setTargetWeekly] = useState(420);
  const [maxWeekly, setMaxWeekly] = useState(900);
  const [totalGoal, setTotalGoal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { weeks, estimatedDate } = calculateWeeksToGoal(0, totalGoal, targetWeekly);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Debes ingresar un nombre para tu meta');
      return;
    }
    if (maxWeekly < targetWeekly) {
      setError('El máximo semanal debe ser mayor o igual al target semanal');
      return;
    }
    setLoading(true);
    try {
      const result = await habits.create.mutateAsync({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || undefined,
        target_minutes_per_week: targetWeekly,
        max_minutes_per_week: maxWeekly,
        total_hours_goal: totalGoal,
        is_active: true,
      });

      if (initialActivity.trim() && result) {
        const activity = await activities.create.mutateAsync({
          user_id: userId,
          name: initialActivity.trim(),
        });
        if (activity) {
          await activities.linkToHabit.mutateAsync({
            habitId: result.id,
            activityId: activity.id,
            weight: 1.0,
          });
        }
      }

      setSuccess(initialActivity.trim()
        ? `¡Meta '${name}' creada con actividad '${initialActivity}' vinculada!`
        : `¡Meta '${name}' creada!`
      );
      setName('');
      setDescription('');
      setInitialActivity('');
      setTargetWeekly(420);
      setMaxWeekly(900);
      setTotalGoal(100);
    } catch {
      setError('Error creando la meta. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5';

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold mb-6">Crear Nueva Meta</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm flex items-center gap-2">
            <span aria-hidden>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm flex items-center gap-2">
            <span aria-hidden>✓</span> {success}
          </div>
        )}

        <div>
          <label className={labelCls}>
            ¿Cuál es tu meta? <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Aprender italiano, Escribir una novela, Meditar 30 min diarios"
            maxLength={255}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Descripción <span className="normal-case font-normal tracking-normal">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Da contexto sobre por qué esta meta es importante para ti"
            maxLength={1000}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls + ' flex items-center gap-1.5'}>
            <Zap size={11} className="text-[var(--color-accent)]" />
            Actividad inicial <span className="normal-case font-normal tracking-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={initialActivity}
            onChange={(e) => setInitialActivity(e.target.value)}
            placeholder="Ej: Estudiar vocabulario, Practicar ejercicios..."
            maxLength={255}
            className={inputCls}
          />
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
            Se creará la actividad y se vinculará automáticamente a este hábito
          </p>
        </div>

        {/* Objetivos de tiempo — stepper cards */}
        <div className="space-y-3 pt-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Objetivos de tiempo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StepperCard
              icon={<Clock size={14} />}
              label="Target semanal"
              sublabel="mínimo recomendado"
              display={formatDuration(targetWeekly)}
              onDecrement={() => setTargetWeekly(Math.max(30, targetWeekly - 30))}
              onIncrement={() => setTargetWeekly(Math.min(10000, targetWeekly + 30))}
            />
            <StepperCard
              icon={<Zap size={14} />}
              label="Máximo semanal"
              sublabel="techo de dedicación"
              display={formatDuration(maxWeekly)}
              onDecrement={() => setMaxWeekly(Math.max(60, maxWeekly - 30))}
              onIncrement={() => setMaxWeekly(Math.min(10000, maxWeekly + 30))}
            />
            <StepperCard
              icon={<Target size={14} />}
              label="Objetivo total"
              sublabel="meta de largo plazo"
              display={`${totalGoal}h`}
              onDecrement={() => setTotalGoal(Math.max(10, totalGoal - 10))}
              onIncrement={() => setTotalGoal(Math.min(10000, totalGoal + 10))}
            />
          </div>
          {targetWeekly > 0 && (
            <div className="alert-info text-sm">
              Con <strong>{formatDuration(targetWeekly)}/semana</strong>, completarás {totalGoal}h en ~<strong>{weeks} semanas</strong> ({estimatedDate})
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Creando...' : 'Crear Meta'}
        </button>
      </form>
    </Card>
  );
}

function HabitList({ userId, habits }: { userId: string; habits: ReturnType<typeof useHabits> }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allHabits = habits.list.data ?? [];
  const metrics = habits.metricsBatch.data ?? [];

  const filtered = allHabits.filter((h) => {
    if (filter === 'active') return h.is_active;
    if (filter === 'inactive') return !h.is_active;
    return true;
  });

  if (allHabits.length === 0) {
    return (
      <Card className="p-5">
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
          <p className="text-[var(--color-text-muted)]">Aún no has creado ninguna meta.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${
              filter === f
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.map((habit) => {
        const metric = metrics.find((m) => m.habit_id === habit.id);
        const isEditing = editingId === habit.id;
        const isConfirmingDelete = confirmDeleteId === habit.id;
        const catInfo = categorizeCompletion(metric?.completion_percentage ?? 0);

        return (
          <Card key={habit.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{habit.is_active ? '🎯' : '⏸️'}</span>
                  <h3 className="font-semibold">{habit.name}</h3>
                </div>
                {habit.description && (
                  <p className="text-sm text-[var(--color-text-muted)] italic">{habit.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Target/sem</p>
                    <p className="text-sm font-semibold">{formatDuration(habit.target_minutes_per_week)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Máx/sem</p>
                    <p className="text-sm font-semibold">{formatDuration(habit.max_minutes_per_week)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Objetivo</p>
                    <p className="text-sm font-semibold">{habit.total_hours_goal}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Status</p>
                    <p className="text-sm font-semibold">{habit.is_active ? '✅ Activo' : '⏸ Pausado'}</p>
                  </div>
                </div>

                {metric && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Invertido</p>
                        <p className="text-sm font-semibold">{formatDuration(metric.total_minutes_invested ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Sesiones</p>
                        <p className="text-sm font-semibold">{metric.total_sessions ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Completado</p>
                        <p className="text-sm font-semibold">{(metric.completion_percentage ?? 0).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, metric.completion_percentage ?? 0)}%`,
                          backgroundColor: catInfo.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(isEditing ? null : habit.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
                >
                  <Edit2 size={14} />
                  Editar
                </button>
                <button
                  onClick={() =>
                    habits.update.mutate({
                      id: habit.id,
                      updates: { is_active: !habit.is_active },
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
                >
                  {habit.is_active ? <Pause size={14} /> : <Play size={14} />}
                  {habit.is_active ? 'Pausar' : 'Activar'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(habit.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <EditHabitForm
                habit={habit}
                onSave={(updates) => {
                  habits.update.mutate({ id: habit.id, updates });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            )}

            {/* Delete Confirmation */}
            {isConfirmingDelete && (
              <div className="alert-warning mt-4">
                <p className="text-sm mb-3">¿Estás seguro de eliminar este hábito?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      habits.remove.mutate(habit.id);
                      setConfirmDeleteId(null);
                    }}
                    className="btn-danger px-3 py-2.5 text-xs font-medium rounded-[var(--radius-md)]"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-2.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover-surface transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function StepperCard({
  icon,
  label,
  sublabel,
  display,
  onDecrement,
  onIncrement,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  display: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const btnCls =
    'w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all text-base leading-none select-none';

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
          {icon}
        </span>
        <div>
          <p className="text-[11px] font-semibold text-[var(--color-text)] leading-tight">{label}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDecrement} className={btnCls}>−</button>
        <span className="text-sm font-bold text-[var(--color-text)] font-[var(--font-mono)] tracking-tight">
          {display}
        </span>
        <button type="button" onClick={onIncrement} className={btnCls}>+</button>
      </div>
    </div>
  );
}

function EditHabitForm({
  habit,
  onSave,
  onCancel,
}: {
  habit: any;
  onSave: (updates: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(habit.name);
  const [desc, setDesc] = useState(habit.description ?? '');
  const [target, setTarget] = useState(habit.target_minutes_per_week);
  const [max, setMax] = useState(habit.max_minutes_per_week);
  const [goal, setGoal] = useState(habit.total_hours_goal);

  const inputCls = 'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5';

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4">
      <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        Editar hábito
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepperCard
          icon={<Clock size={14} />}
          label="Target semanal"
          sublabel="mínimo / semana"
          display={formatDuration(target)}
          onDecrement={() => setTarget(Math.max(30, target - 30))}
          onIncrement={() => setTarget(Math.min(10000, target + 30))}
        />
        <StepperCard
          icon={<Zap size={14} />}
          label="Máximo semanal"
          sublabel="techo / semana"
          display={formatDuration(max)}
          onDecrement={() => setMax(Math.max(60, max - 30))}
          onIncrement={() => setMax(Math.min(10000, max + 30))}
        />
        <StepperCard
          icon={<Target size={14} />}
          label="Objetivo total"
          sublabel="meta final"
          display={`${goal}h`}
          onDecrement={() => setGoal(Math.max(10, goal - 10))}
          onIncrement={() => setGoal(Math.min(10000, goal + 10))}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name, description: desc, target_minutes_per_week: target, max_minutes_per_week: max, total_hours_goal: goal })}
          className="px-4 py-2 text-sm font-semibold bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

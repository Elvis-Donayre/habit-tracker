import { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useHabits } from '@/hooks/useHabits';
import { Button } from '@/components/ui/Button';
import type { Activity } from '@/types';

interface Props {
  userId?: string;
  activity?: Activity;
  onSubmitted: () => void;
  onCancel: () => void;
}

const TIPOS = ['Estudio', 'Ejercicio', 'Proyecto', 'Lectura', 'Práctica', 'Arte', 'Idioma', 'Otro'];
const TIPO_ICONS: Record<string, string> = {
  Estudio: '📚', Ejercicio: '💪', Proyecto: '🚀', Lectura: '📖',
  Práctica: '🎯', Arte: '🎨', Idioma: '🌍', Otro: '⚙️',
};

const inputCls =
  'w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-colors placeholder:text-[var(--color-text-muted)]';
const labelCls =
  'block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5';
const stepperBtnCls =
  'w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all text-base leading-none select-none';

export function ActivityForm({ userId, activity, onSubmitted, onCancel }: Props) {
  const activities = useActivities(userId);
  const habits = useHabits(userId);
  const habitList = (habits.list.data ?? []).filter((h) => h.is_active);

  const [nombre, setNombre] = useState(activity?.name ?? '');
  const [descripcion, setDescripcion] = useState(activity?.description ?? '');
  const [tipo, setTipo] = useState(activity?.tipo ?? '');
  const [maxSesiones, setMaxSesiones] = useState(activity?.maximo_sesiones_diarias ?? 0);
  const [valorObjetivo, setValorObjetivo] = useState(activity?.valor_objetivo?.toString() ?? '');
  const [unidadObjetivo, setUnidadObjetivo] = useState(activity?.valor_objetivo_unidad ?? '');
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [formError, setFormError] = useState('');

  const isEditing = !!activity;
  const isPending = activities.create.isPending || activities.update.isPending || activities.linkToHabit.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nombre.trim()) {
      setFormError('El nombre es requerido');
      return;
    }
    const maxSesNum = maxSesiones > 0 ? maxSesiones : undefined;
    if (maxSesNum !== undefined && (maxSesNum < 1 || maxSesNum > 24)) {
      setFormError('Máx. sesiones/día debe ser un número entre 1 y 24');
      return;
    }
    const valObjetivoNum = valorObjetivo !== '' ? Number(valorObjetivo) : undefined;
    if (valObjetivoNum !== undefined && (isNaN(valObjetivoNum) || valObjetivoNum < 0)) {
      setFormError('El valor objetivo debe ser un número mayor o igual a 0');
      return;
    }
    if (!userId) return;

    const payload = {
      user_id: userId,
      name: nombre.trim(),
      description: descripcion.trim() || undefined,
      tipo: tipo || undefined,
      maximo_sesiones_diarias: maxSesNum,
      valor_objetivo: valObjetivoNum,
      valor_objetivo_unidad: unidadObjetivo.trim() || undefined,
    };

    const handleError = (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else if (err && typeof err === 'object' && 'message' in err) {
        setFormError(String((err as { message: unknown }).message));
      } else {
        setFormError('Error al guardar la actividad. Intenta de nuevo.');
      }
    };

    if (isEditing) {
      activities.update.mutate(
        { id: activity.id, ...payload },
        { onSuccess: onSubmitted, onError: handleError }
      );
    } else {
      activities.create.mutateAsync(payload as Omit<Activity, 'id' | 'created_at' | 'updated_at'>)
        .then(async (newActivity) => {
          if (selectedHabitId && newActivity?.id) {
            await activities.linkToHabit.mutateAsync({
              habitId: selectedHabitId,
              activityId: newActivity.id,
              weight: 1.0,
            });
          }
          onSubmitted();
        })
        .catch(handleError);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Nombre */}
      <div>
        <label className={labelCls}>
          Nombre <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Programación"
          className={inputCls}
          maxLength={255}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className={labelCls}>
          Descripción{' '}
          <span className="normal-case font-normal tracking-normal">(opcional)</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Agrega contexto o notas sobre esta actividad..."
          className={`${inputCls} resize-none`}
          rows={2}
          maxLength={1000}
        />
      </div>

      {/* Tipo — chips pill */}
      <div>
        <label className={labelCls}>Tipo</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(tipo === t ? '' : t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-full)] border transition-all ${
                tipo === t
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-[var(--shadow-sm)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              <span role="img" aria-hidden>{TIPO_ICONS[t]}</span>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Límites y objetivos */}
      <div className="space-y-3">
        <p className={labelCls}>Límites y objetivos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Máx. sesiones / día — stepper */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3 shadow-[var(--shadow-xs)]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                <span className="text-[11px]">🔁</span>
              </span>
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-text)] leading-tight">Máx. sesiones / día</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">cuántas veces al día</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMaxSesiones(Math.max(0, maxSesiones - 1))}
                className={stepperBtnCls}
              >
                −
              </button>
              <span className="text-sm font-bold text-[var(--color-text)] font-[var(--font-mono)]">
                {maxSesiones > 0 ? maxSesiones : '—'}
              </span>
              <button
                type="button"
                onClick={() => setMaxSesiones(Math.min(24, maxSesiones + 1))}
                className={stepperBtnCls}
              >
                +
              </button>
            </div>
          </div>

          {/* Valor objetivo + unidad */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3 shadow-[var(--shadow-xs)]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                <span className="text-[11px]">🏁</span>
              </span>
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-text)] leading-tight">Valor objetivo</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">meta cuantificable</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={valorObjetivo}
                onChange={(e) => setValorObjetivo(e.target.value)}
                placeholder="100"
                className="w-20 px-2 py-1.5 text-sm text-center font-bold rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-colors font-[var(--font-mono)]"
                inputMode="decimal"
              />
              <input
                type="text"
                value={unidadObjetivo}
                onChange={(e) => setUnidadObjetivo(e.target.value)}
                placeholder="horas, páginas..."
                className="flex-1 px-2 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-colors placeholder:text-[var(--color-text-muted)]"
                maxLength={50}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vincular a hábito */}
      {!isEditing && habitList.length > 0 && (
        <div>
          <label className={labelCls}>
            Vincular a hábito{' '}
            <span className="normal-case font-normal tracking-normal">(opcional)</span>
          </label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className={inputCls}
          >
            <option value="">Sin vincular</option>
            {habitList.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {selectedHabitId && (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
              La actividad contribuirá al progreso de este hábito.
            </p>
          )}
        </div>
      )}

      {formError && (
        <p className="text-xs text-[var(--color-danger)] flex items-center gap-1.5">
          <span aria-hidden>⚠</span> {formError}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? 'Guardando…' : isEditing ? 'Actualizar' : 'Crear actividad'}
        </Button>
      </div>
    </form>
  );
}

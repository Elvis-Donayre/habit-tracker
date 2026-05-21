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

const inputClass =
  'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors';
const labelClass =
  'block text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium mb-1';

export function ActivityForm({ userId, activity, onSubmitted, onCancel }: Props) {
  const activities = useActivities(userId);
  const habits = useHabits(userId);
  const habitList = (habits.list.data ?? []).filter((h) => h.is_active);

  const [nombre, setNombre] = useState(activity?.name ?? '');
  const [descripcion, setDescripcion] = useState(activity?.description ?? '');
  const [tipo, setTipo] = useState(activity?.tipo ?? '');
  const [maxSesiones, setMaxSesiones] = useState(activity?.maximo_sesiones_diarias?.toString() ?? '');
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
    const maxSesNum = maxSesiones !== '' ? Number(maxSesiones) : undefined;
    if (maxSesNum !== undefined && (isNaN(maxSesNum) || maxSesNum < 1 || maxSesNum > 24)) {
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Programación"
            className={inputClass}
            maxLength={255}
          />
        </div>
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin tipo</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción opcional..."
          className={`${inputClass} resize-none`}
          rows={2}
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Máx. sesiones/día</label>
          <input
            type="number"
            value={maxSesiones}
            onChange={(e) => setMaxSesiones(e.target.value)}
            placeholder="Ej: 2"
            className={inputClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={labelClass}>Valor objetivo</label>
          <input
            type="number"
            value={valorObjetivo}
            onChange={(e) => setValorObjetivo(e.target.value)}
            placeholder="Ej: 100"
            className={inputClass}
            inputMode="decimal"
          />
        </div>
        <div>
          <label className={labelClass}>Unidad</label>
          <input
            type="text"
            value={unidadObjetivo}
            onChange={(e) => setUnidadObjetivo(e.target.value)}
            placeholder="Ej: horas"
            className={inputClass}
            maxLength={50}
          />
        </div>
      </div>

      {!isEditing && habitList.length > 0 && (
        <div>
          <label className={labelClass}>Vincular a hábito (opcional)</label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin vincular</option>
            {habitList.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {selectedHabitId && (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              La actividad contribuirá al progreso de este hábito.
            </p>
          )}
        </div>
      )}

      {formError && (
        <p className="text-xs text-[var(--color-danger)]">{formError}</p>
      )}

      <div className="flex gap-2 justify-end pt-2">
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

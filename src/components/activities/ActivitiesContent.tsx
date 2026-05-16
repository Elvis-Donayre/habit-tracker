import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { ActivityForm } from './ActivityForm';
import { ActivityMatrix } from './ActivityMatrix';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Activity, Search, Edit3, Check, Hash, Target, Trash2, X, BarChart, Calendar } from 'lucide-react';

export function ActivitiesContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const activities = useActivities(userId);
  const { data: activityList, isLoading, isError, error } = activities.list;
  const matrixData = activities.matrix.data ?? [];

  const [activityStats, setActivityStats] = useState<Record<string, { total_sessions?: number; benefited_habits?: string }>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!activityList) return;

    const stats: Record<string, { total_sessions?: number; benefited_habits?: string }> = {};
    activityList.forEach((act) => {
      const relatedEntries = matrixData.filter((m) => m.actividad_nombre === act.name);
      const totalSessions = relatedEntries.reduce((sum, entry) => sum + (entry.total_sesiones || 0), 0);
      stats[act.id] = {
        total_sessions: totalSessions,
        benefited_habits: act.description || undefined,
      };
    });
    setActivityStats(stats);
  }, [activityList, matrixData]);

  const [searchTerm, setSearchTerm] = useState('');
  const filteredActivities = (activityList || []).filter((act) =>
    act.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-border)] rounded-[var(--radius-md)]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[var(--color-border)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert-danger flex items-center gap-3">
        <span className="text-base">⚠️</span>
        <p className="text-sm">Error al cargar actividades: {String(error)}</p>
      </div>
    );
  }

  const totalCount = activityList?.length || 0;
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-[var(--color-accent)]" />
            Actividades
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Gestiona tus actividades y revisa tu matriz de seguimiento
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          icon={<Plus size={14} />}
        >
          Nueva actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-enter">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-semibold tracking-wide text-[var(--color-text-muted)]">Total</span>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{totalCount}</p>
            </div>
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] flex items-center justify-center">
              <Activity size={16} className="text-[var(--color-accent)]" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-semibold tracking-wide text-[var(--color-text-muted)]">Esta semana</span>
              <p className="text-2xl font-bold text-[var(--color-success)]">
                {new Set(matrixData.filter((m) => m.total_sesiones > 0).map((m) => m.actividad_nombre)).size}
              </p>
            </div>
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] flex items-center justify-center">
              <Calendar size={16} className="text-[var(--color-success)]" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-semibold tracking-wide text-[var(--color-text-muted)]">Sesiones totales</span>
              <p className="text-2xl font-bold text-[var(--color-warning)]">
                {matrixData.reduce((sum, m) => sum + (m.total_sesiones || 0), 0)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] flex items-center justify-center">
              <BarChart size={16} className="text-[var(--color-warning)]" />
            </div>
          </div>
        </Card>
      </div>

      {showForm && (
        <Card className="p-5 border-[var(--color-accent)]/30">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 size={16} className="text-[var(--color-accent)]" />
                Editar actividad
              </>
            ) : (
              <>
                <Plus size={16} className="text-[var(--color-accent)]" />
                Nueva actividad
              </>
            )}
          </h2>
          <ActivityForm
            userId={userId}
            activity={editingId ? activityList?.find((a) => a.id === editingId) : undefined}
            onSubmitted={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </Card>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Buscar actividades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
        />
      </div>

      <div className="space-y-3 stagger-enter">
        {filteredActivities.map((activity, index) => {
          const stats = activityStats[activity.id];

          return (
            <div key={activity.id}>
              {editingId === activity.id ? (
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Check size={14} className="text-[var(--color-accent)]" />
                    <span className="text-[11px] uppercase tracking-wider text-[var(--color-accent)] font-semibold">Editando</span>
                  </div>
                  <ActivityForm
                    userId={userId}
                    activity={activity}
                    onSubmitted={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div
                  className="card-interactive p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{activity.name}</span>
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                        style={{
                          color: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                          backgroundColor: 'var(--color-accent-soft)',
                        }}
                      >
                        {activity.tipo}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      {activity.maximo_sesiones_diarias && (
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {activity.maximo_sesiones_diarias} ses/día
                        </span>
                      )}
                      {activity.valor_objetivo && activity.valor_objetivo_unidad && (
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          {activity.valor_objetivo} {activity.valor_objetivo_unidad}
                        </span>
                      )}
                      {stats?.total_sessions !== undefined && (
                        <span className="flex items-center gap-1">
                          <BarChart size={12} />
                          {stats.total_sessions} sesiones totales
                        </span>
                      )}
                    </div>
                    {stats?.benefited_habits && (
                      <div className="alert-success text-xs p-2">
                        Beneficia: {stats.benefited_habits}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setEditingId(activity.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover-surface transition-colors"
                    >
                      <Edit3 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(activity.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover-surface transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {confirmDeleteId === activity.id && (
                <div className="alert-warning mt-3">
                  <p className="text-sm mb-3">¿Estás seguro de eliminar esta actividad? Se perderán todos los datos asociados.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        activities.remove.mutate(activity.id);
                        setConfirmDeleteId(null);
                      }}
                      className="btn-danger px-3 py-1.5 text-xs font-medium rounded-lg"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover-surface"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-4">
              <Activity size={28} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="text-sm font-semibold mb-1">
              {searchTerm ? 'Sin resultados' : 'Sin actividades'}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {searchTerm
                ? `No se encontraron actividades para "${searchTerm}"`
                : 'Crea tu primera actividad para empezar a hacer seguimiento'}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
                icon={<Plus size={14} />}
              >
                Crear actividad
              </Button>
            )}
          </Card>
        )}
      </div>

      {matrixData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart size={18} className="text-[var(--color-accent)]" />
            Matriz semanal
          </h2>
          <ActivityMatrix data={matrixData} weekDays={weekDays} />
        </div>
      )}
    </div>
  );
}

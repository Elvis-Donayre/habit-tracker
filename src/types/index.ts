export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category_id?: number;
  target_minutes_per_week: number;
  max_minutes_per_week: number;
  total_hours_goal: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitProgress {
  id: string;
  user_id: string;
  actividad_nombre: string;
  description?: string;
  target_minutes_per_week: number;
  max_minutes_per_week: number;
  total_hours_goal: number;
  is_active: boolean;
  total_minutes_invested: number;
  total_sessions: number;
  completed_sessions: number;
  current_streak: number;
  longest_streak: number;
  completion_percentage: number;
}

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category_id?: number;
  tipo?: string;
  maximo_sesiones_diarias?: number;
  valor_objetivo?: number;
  valor_objetivo_unidad?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitActivity {
  id: string;
  habit_id: string;
  activity_id: string;
  weight: number;
  created_at: string;
  updated_at: string;
  habits?: { id: string; name: string };
}

export interface Session {
  id: string;
  activity_id: string;
  duration_minutes: number;
  session_date: string;
  start_time?: string;
  notes?: string;
  mood?: number;
  productivity_level?: number;
  book_title?: string;
  created_at: string;
  activities?: { user_id: string; name: string };
}

export interface WeeklySummary {
  user_id: string;
  actividad_nombre: string;
  total_sesiones_completadas: number;
  duracion_total_minutos: number;
  duracion_promedio_minutos: number;
}

export interface ActivityHabitMatrix {
  user_id: string;
  activity_id?: string;
  actividad_nombre: string;
  dia_semana: string;
  total_sesiones: number;
  sesiones_completadas: number;
  total_minutos?: number;
}

export interface Category {
  id: number;
  name: string;
  color?: string;
  type: 'system' | 'personal';
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  created_at: string;
}

export interface HabitMetrics {
  habit_id: string;
  total_minutes_invested: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  completion_percentage: number;
}

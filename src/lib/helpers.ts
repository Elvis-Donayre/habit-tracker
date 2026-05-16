export function formatDuration(minutes: number): string {
  const mins = Math.floor(minutes);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function categorizeCompletion(percentage: number): {
  status: string;
  color: string;
  icon: string;
  message: string;
} {
  if (percentage >= 100) {
    return { status: 'Completado', color: 'var(--color-success)', icon: '✅', message: '¡Objetivo alcanzado!' };
  } else if (percentage >= 75) {
    return { status: 'Excelente progreso', color: 'var(--color-accent)', icon: '🔥', message: 'Casi llegas a la meta' };
  } else if (percentage >= 50) {
    return { status: 'Buen ritmo', color: 'var(--color-warning)', icon: '⚡', message: 'Vas por buen camino' };
  } else if (percentage >= 25) {
    return { status: 'En progreso', color: 'var(--color-warning)', icon: '📈', message: 'Continúa así' };
  }
  return { status: 'Recién comenzando', color: 'var(--color-text-muted)', icon: '🚀', message: '¡Empieza tu viaje!' };
}

export function calculateWeeklyCompliance(
  minutesThisWeek: number,
  targetMinutesPerWeek: number
): { percentage: number; status: string; color: string } {
  if (targetMinutesPerWeek <= 0) {
    return { percentage: 0, status: 'Sin target', color: 'var(--color-text-muted)' };
  }
  const pct = (minutesThisWeek / targetMinutesPerWeek) * 100;
  let status: string;
  let color: string;
  if (pct >= 100) {
    status = '✅ Completado';
    color = 'var(--color-success)';
  } else if (pct >= 75) {
    status = '⚡ Casi ahí';
    color = 'var(--color-accent)';
  } else if (pct >= 50) {
    status = '📊 En camino';
    color = 'var(--color-warning)';
  } else {
    status = '⚠️ Rezagado';
    color = 'var(--color-danger)';
  }
  return { percentage: Math.round(pct * 10) / 10, status, color };
}

export function calculateWeeksToGoal(
  currentMinutes: number,
  goalHours: number,
  minutesPerWeek: number
): { weeks: number; estimatedDate: string } {
  const totalGoalMinutes = goalHours * 60;
  const remaining = totalGoalMinutes - currentMinutes;
  if (minutesPerWeek <= 0) return { weeks: 0, estimatedDate: 'N/A' };
  const weeks = Math.max(0, Math.ceil(remaining / minutesPerWeek));
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + weeks * 7);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return { weeks, estimatedDate: `${months[estDate.getMonth()]} ${estDate.getFullYear()}` };
}

export function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Debe incluir al menos una mayúscula' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Debe incluir al menos una minúscula' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Debe incluir al menos un número' };
  return { valid: true, message: '' };
}

export function formatDateSpanish(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

export function getMoodEmoji(mood: number): string {
  const map: Record<number, string> = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };
  return map[mood] ?? '😐';
}

export function getProductivityBars(productivity: number): string {
  return '★'.repeat(productivity) + '☆'.repeat(5 - productivity);
}

export function getBarColor(pct: number): string {
  if (pct >= 75) return 'var(--color-success)';
  if (pct >= 50) return 'var(--color-accent)';
  if (pct >= 25) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

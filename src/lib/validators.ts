import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const signupSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[a-z]/, 'Debe incluir una minúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

export const habitSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.number().nullable().optional(),
  targetMinutesPerWeek: z.number().min(30).max(10000),
  maxMinutesPerWeek: z.number().min(60).max(10000),
  totalHoursGoal: z.number().min(10).max(10000),
}).refine((data) => data.maxMinutesPerWeek >= data.targetMinutesPerWeek, {
  message: 'El máximo semanal debe ser mayor o igual al target semanal',
  path: ['maxMinutesPerWeek'],
});

export const activitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.number().nullable().optional(),
});

export const sessionSchema = z.object({
  activityId: z.string().uuid(),
  durationMinutes: z.number().min(1).max(480),
  sessionDate: z.string(),
  startTime: z.string().optional(),
  notes: z.string().max(2000).optional(),
  mood: z.number().min(1).max(5).optional(),
  productivityLevel: z.number().min(1).max(5).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type SessionInput = z.infer<typeof sessionSchema>;

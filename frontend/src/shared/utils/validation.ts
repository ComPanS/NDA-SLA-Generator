import { z } from 'zod';

export const emailSchema = z.string().email('Некорректный email');

export const passwordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 'Пароль должен содержать минимум 8 символов, буквы в разном регистре и цифра');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

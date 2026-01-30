import { z } from 'zod';

export const emailSchema = z.string().email('Некорректный email');

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен содержать минимум 6 символов');

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

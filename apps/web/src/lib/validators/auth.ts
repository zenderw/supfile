import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(1, { message: 'Mot de passe requis' }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z
    .string()
    .min(8, { message: 'Au moins 8 caractères' })
    .max(128, { message: 'Trop long' }),
  displayName: z.string().min(1, { message: 'Nom requis' }).max(80, { message: 'Trop long' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

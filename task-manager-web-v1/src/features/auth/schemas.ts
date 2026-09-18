import { z } from 'zod'

/**
 * Source unique des règles de saisie de l'authentification (ADR-018). Les contraintes
 * reproduisent celles du serveur (RegisterRequest / LoginRequest) : le serveur reste
 * l'autorité de sécurité, ces schémas servent l'ergonomie et le typage.
 */
export const loginSchema = z.object({
  email: z.string().min(1, "L'email est obligatoire.").email("Format d'email invalide."),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  email: z
    .string()
    .min(1, "L'email est obligatoire.")
    .email("Format d'email invalide.")
    .max(180, "L'email ne peut pas dépasser 180 caractères."),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères.'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>

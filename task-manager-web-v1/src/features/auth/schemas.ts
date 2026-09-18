import { z } from 'zod'

/**
 * Source unique des règles de saisie de l'authentification (ADR-018). Les contraintes
 * reproduisent celles du serveur (RegisterRequest / LoginRequest) : le serveur reste
 * l'autorité de sécurité, ces schémas servent l'ergonomie et le typage.
 * Les messages sont des clés de traduction, rendues par FormFieldShell.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'validation.email.required').email('validation.email.format'),
  password: z.string().min(1, 'validation.password.required'),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'validation.fullName.size')
    .max(120, 'validation.fullName.size'),
  email: z
    .string()
    .min(1, 'validation.email.required')
    .email('validation.email.format')
    .max(180, 'validation.email.size'),
  password: z.string().min(8, 'validation.password.size').max(72, 'validation.password.size'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>

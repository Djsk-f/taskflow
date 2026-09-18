import { z } from 'zod'

/** Règles de saisie du profil, alignées sur UpdateProfileRequest / ChangePasswordRequest. */
export const profileSchema = z.object({
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
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.currentPassword.required'),
    newPassword: z
      .string()
      .min(8, 'validation.password.size')
      .max(72, 'validation.password.size'),
    confirmation: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmation, {
    path: ['confirmation'],
    message: 'validation.password.confirmation',
  })

export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordValues = z.infer<typeof passwordSchema>

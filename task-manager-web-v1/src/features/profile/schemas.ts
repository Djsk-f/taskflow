import { z } from 'zod'

/** Règles de saisie du profil, alignées sur UpdateProfileRequest / ChangePasswordRequest. */
export const profileSchema = z.object({
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
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire.'),
    newPassword: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.')
      .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères.'),
    confirmation: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmation, {
    path: ['confirmation'],
    message: 'La confirmation ne correspond pas au nouveau mot de passe.',
  })

export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordValues = z.infer<typeof passwordSchema>

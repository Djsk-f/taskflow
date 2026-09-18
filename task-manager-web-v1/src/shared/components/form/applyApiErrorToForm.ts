import { extractApiError } from '@/shared/api/extractApiError'
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

/**
 * Report unique des erreurs du serveur dans un formulaire (INV-21) : les `fieldErrors`
 * de l'API atterrissent sous le bon champ, et le message restant — celui qui ne concerne
 * aucun champ en particulier — est renvoyé pour affichage en bandeau.
 *
 * @returns le message à afficher globalement, ou null si tout a été placé par champ.
 */
export function applyApiErrorToForm<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
): string | null {
  const { message, fieldErrors } = extractApiError(error)

  const knownFieldErrors = fieldErrors.filter((fieldError) => fieldError.field.length > 0)
  knownFieldErrors.forEach((fieldError) => {
    setError(fieldError.field as FieldPath<TValues>, { type: 'server', message: fieldError.message })
  })

  return knownFieldErrors.length > 0 ? null : message
}

import type { TFunction } from 'i18next'

/**
 * Un message d'erreur est soit une clé (validation côté client : `validation.title.required`),
 * soit un texte déjà traduit par le serveur (Accept-Language). Seules les clés passent par t().
 */
export function translateMessage(t: TFunction, message: string | undefined): string | undefined {
  if (!message) {
    return message
  }
  return message.startsWith('validation.') ? (t as (key: string) => string)(message) : message
}

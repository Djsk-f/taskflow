import type { FieldError } from 'react-hook-form'

/** Identifiant du message d'erreur d'un champ, partagé par le champ et son message. */
export function fieldErrorId(name: string): string {
  return `${name}-error`
}

export function fieldHintId(name: string): string {
  return `${name}-hint`
}

/** Attributs d'accessibilité du contrôle : il est décrit par son aide et par son erreur. */
export function fieldControlProps(name: string, error?: FieldError, hasHint = false) {
  const describedBy = [hasHint && fieldHintId(name), error && fieldErrorId(name)].filter(Boolean).join(' ')
  return {
    id: name,
    'aria-invalid': error !== undefined,
    'aria-describedby': describedBy || undefined,
  }
}

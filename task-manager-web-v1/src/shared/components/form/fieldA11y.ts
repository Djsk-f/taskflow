import type { FieldError } from 'react-hook-form'

/** Identifiant du message d'erreur d'un champ, partagé par le champ et son message. */
export function fieldErrorId(name: string): string {
  return `${name}-error`
}

/** Attributs d'accessibilité du contrôle, cohérents avec l'identifiant de son erreur. */
export function fieldControlProps(name: string, error?: FieldError) {
  return {
    id: name,
    'aria-invalid': error !== undefined,
    'aria-describedby': error ? fieldErrorId(name) : undefined,
  }
}

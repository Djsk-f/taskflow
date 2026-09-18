import { fieldErrorId, fieldHintId } from '@/shared/components/form/fieldA11y'
import { translateMessage } from '@/shared/i18n/translateMessage'
import { cn } from '@/shared/lib/utils'
import { Label } from '@/shared/ui/label'
import type { ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

/**
 * Rendu unique d'un champ de formulaire : libellé, contrôle, message d'erreur (INV-21).
 * Les champs texte, zone de texte et liste de choix ne diffèrent que par leur contrôle ;
 * tout le reste — y compris le lien d'accessibilité vers l'erreur — vit ici.
 */
export function FormFieldShell({
  name,
  label,
  error,
  hint,
  className,
  children,
}: {
  name: string
  label: string
  error?: FieldError
  /** Aide affichée sous le contrôle (format attendu, exemple). */
  hint?: string
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && (
        <p id={fieldHintId(name)} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldErrorId(name)} className="text-destructive text-sm">
          {translateMessage(t, error.message)}
        </p>
      )}
    </div>
  )
}

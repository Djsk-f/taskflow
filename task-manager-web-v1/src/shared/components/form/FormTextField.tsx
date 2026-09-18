import { fieldControlProps } from '@/shared/components/form/fieldA11y'
import { FormFieldShell } from '@/shared/components/form/FormFieldShell'
import { Input } from '@/shared/ui/input'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type FormTextFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  type?: 'text' | 'email' | 'password' | 'date' | 'datetime-local'
  hint?: string
  placeholder?: string
  autoComplete?: string
  className?: string
}

/**
 * Pont unique entre react-hook-form et les primitives shadcn/ui pour un champ texte
 * (INV-21). Aucun écran ne réécrit cette plomberie. Un mot de passe peut être affiché
 * pour vérifier sa saisie (connexion, inscription, profil).
 */
export function FormTextField<TValues extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  hint,
  className,
}: FormTextFieldProps<TValues>) {
  const [revealed, setRevealed] = useState(false)
  const { t } = useTranslation()
  const isPassword = type === 'password'
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldShell name={name} label={label} error={fieldState.error} hint={hint} className={className}>
          <div className="relative">
            <Input
              {...field}
              {...fieldControlProps(name, fieldState.error, hint !== undefined)}
              value={field.value ?? ''}
              type={isPassword && revealed ? 'text' : type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              className={isPassword ? 'pr-11' : undefined}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                aria-label={revealed ? t('auth.passwordHide') : t('auth.passwordShow')}
                aria-controls={name}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none focus-visible:ring-[3px]"
              >
                {revealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            )}
          </div>
        </FormFieldShell>
      )}
    />
  )
}

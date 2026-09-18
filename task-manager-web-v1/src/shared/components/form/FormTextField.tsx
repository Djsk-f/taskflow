import { fieldControlProps } from '@/shared/components/form/fieldA11y'
import { FormFieldShell } from '@/shared/components/form/FormFieldShell'
import { Input } from '@/shared/ui/input'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

type FormTextFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  type?: 'text' | 'email' | 'password' | 'datetime-local'
  placeholder?: string
  autoComplete?: string
  className?: string
}

/**
 * Pont unique entre react-hook-form et les primitives shadcn/ui pour un champ texte
 * (INV-21). Aucun écran ne réécrit cette plomberie.
 */
export function FormTextField<TValues extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  className,
}: FormTextFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldShell name={name} label={label} error={fieldState.error} className={className}>
          <Input
            {...field}
            {...fieldControlProps(name, fieldState.error)}
            value={field.value ?? ''}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        </FormFieldShell>
      )}
    />
  )
}

import { fieldControlProps } from '@/shared/components/form/fieldA11y'
import { FormFieldShell } from '@/shared/components/form/FormFieldShell'
import { Textarea } from '@/shared/ui/textarea'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

type FormTextareaFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  placeholder?: string
  rows?: number
  className?: string
}

export function FormTextareaField<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 4,
  className,
}: FormTextareaFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldShell name={name} label={label} error={fieldState.error} className={className}>
          <Textarea
            {...field}
            {...fieldControlProps(name, fieldState.error)}
            value={field.value ?? ''}
            rows={rows}
            placeholder={placeholder}
          />
        </FormFieldShell>
      )}
    />
  )
}

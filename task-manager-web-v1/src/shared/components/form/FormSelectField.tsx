import { fieldControlProps } from '@/shared/components/form/fieldA11y'
import { FormFieldShell } from '@/shared/components/form/FormFieldShell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

export type SelectOption = { value: string; label: string }

type FormSelectFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  options: readonly SelectOption[]
  className?: string
}

export function FormSelectField<TValues extends FieldValues>({
  control,
  name,
  label,
  options,
  className,
}: FormSelectFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldShell name={name} label={label} error={fieldState.error} className={className}>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SelectTrigger {...fieldControlProps(name, fieldState.error)} className="w-full">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldShell>
      )}
    />
  )
}

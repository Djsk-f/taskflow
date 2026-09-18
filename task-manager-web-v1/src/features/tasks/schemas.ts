import type { TaskPayload } from '@/features/tasks/types'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/features/tasks/types'
import { fromDateTimeLocalValue } from '@/shared/lib/formatDate'
import { z } from 'zod'

/**
 * Source unique des règles de saisie d'une tâche (ADR-018), alignée sur TaskRequest du
 * serveur : titre 1–150 obligatoire, description ≤ 2000.
 */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'validation.title.required')
    .max(150, 'validation.title.size'),
  description: z.string().trim().max(2000, 'validation.description.size'),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  /** Valeur d'un champ `datetime-local`, vide si aucune échéance. */
  dueDate: z.string(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

/**
 * Traduction unique formulaire → charge utile de l'API : les chaînes vides deviennent
 * des champs absents, l'échéance locale devient un instant UTC.
 */
export function toTaskPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title,
    description: values.description.length > 0 ? values.description : undefined,
    status: values.status,
    priority: values.priority,
    dueDate: fromDateTimeLocalValue(values.dueDate),
  }
}

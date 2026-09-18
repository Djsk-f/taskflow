import type { Task, TaskPayload } from '@/features/tasks/types'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/features/tasks/types'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/shared/lib/formatDate'
import { z } from 'zod'

/**
 * Rappel d'une tâche, tel que l'utilisateur le choisit. Le serveur ne connaît qu'un
 * instant (`reminderAt`) : « 1 h avant » est converti à l'enregistrement, et retrouvé
 * à la relecture tant que l'écart avec l'échéance est exactement celui-là.
 */
export const REMINDER_MODES = ['NONE', 'HOUR_BEFORE', 'DAY_BEFORE', 'CUSTOM'] as const
export type ReminderMode = (typeof REMINDER_MODES)[number]
const REMINDER_OFFSETS_MS = { HOUR_BEFORE: 3_600_000, DAY_BEFORE: 86_400_000 } as const

/**
 * Source unique des règles de saisie d'une tâche (ADR-018), alignée sur TaskRequest du
 * serveur : titre 1–150 obligatoire, description ≤ 2000.
 */
export const taskFormSchema = z
  .object({
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
    reminder: z.enum(REMINDER_MODES),
    /** Date précise du rappel (mode CUSTOM), valeur `datetime-local`. */
    reminderAt: z.string(),
  })
  .superRefine((values, context) => {
    if (values.reminder === 'CUSTOM' && !fromDateTimeLocalValue(values.reminderAt)) {
      context.addIssue({ code: 'custom', path: ['reminderAt'], message: 'validation.reminder.required' })
    }
    if (values.reminder in REMINDER_OFFSETS_MS && !fromDateTimeLocalValue(values.dueDate)) {
      context.addIssue({ code: 'custom', path: ['reminder'], message: 'validation.reminder.needsDueDate' })
    }
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
    reminderAt: reminderInstant(values),
  }
}

function reminderInstant(values: TaskFormValues): string | undefined {
  if (values.reminder === 'CUSTOM') {
    return fromDateTimeLocalValue(values.reminderAt)
  }
  const dueDate = fromDateTimeLocalValue(values.dueDate)
  if (values.reminder === 'NONE' || !dueDate) {
    return undefined
  }
  return new Date(Date.parse(dueDate) - REMINDER_OFFSETS_MS[values.reminder]).toISOString()
}

/** Tâche → valeurs du formulaire de modification (rappel relatif retrouvé si possible). */
export function toTaskFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: toDateTimeLocalValue(task.dueDate),
    ...reminderFormValues(task),
  }
}

function reminderFormValues(task: Task): Pick<TaskFormValues, 'reminder' | 'reminderAt'> {
  if (!task.reminderAt) {
    return { reminder: 'NONE', reminderAt: '' }
  }
  if (task.dueDate) {
    const gap = Date.parse(task.dueDate) - Date.parse(task.reminderAt)
    const mode = (Object.keys(REMINDER_OFFSETS_MS) as (keyof typeof REMINDER_OFFSETS_MS)[]).find(
      (candidate) => REMINDER_OFFSETS_MS[candidate] === gap,
    )
    if (mode) {
      return { reminder: mode, reminderAt: '' }
    }
  }
  return { reminder: 'CUSTOM', reminderAt: toDateTimeLocalValue(task.reminderAt) }
}

import { taskFormSchema, toTaskFormValues, toTaskPayload, type TaskFormValues } from '@/features/tasks/schemas'
import type { Task } from '@/features/tasks/types'
import { toDateTimeLocalValue } from '@/shared/lib/formatDate'
import { describe, expect, it } from 'vitest'

const DUE = '2026-09-25T15:00:00.000Z'
const BASE: TaskFormValues = {
  title: 'Envoyer le devis',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: toDateTimeLocalValue(DUE),
  reminder: 'NONE',
  reminderAt: '',
}

describe('rappel d’une tâche', () => {
  it('convertit « 1 h avant » et « 1 jour avant » en instant pour le serveur', () => {
    expect(toTaskPayload({ ...BASE, reminder: 'HOUR_BEFORE' }).reminderAt).toBe('2026-09-25T14:00:00.000Z')
    expect(toTaskPayload({ ...BASE, reminder: 'DAY_BEFORE' }).reminderAt).toBe('2026-09-24T15:00:00.000Z')
    expect(toTaskPayload(BASE).reminderAt).toBeUndefined()
  })

  it('retrouve le mode relatif à la relecture, et « date précise » sinon', () => {
    const task = { id: 1, title: 'x', status: 'TODO', priority: 'LOW', dueDate: DUE, createdAt: DUE, updatedAt: DUE, timeSpentMinutes: 0 } satisfies Task
    expect(toTaskFormValues({ ...task, reminderAt: '2026-09-25T14:00:00.000Z' }).reminder).toBe('HOUR_BEFORE')
    expect(toTaskFormValues({ ...task, reminderAt: '2026-09-20T09:00:00.000Z' })).toMatchObject({
      reminder: 'CUSTOM',
      reminderAt: toDateTimeLocalValue('2026-09-20T09:00:00.000Z'),
    })
    expect(toTaskFormValues(task).reminder).toBe('NONE')
  })

  it('refuse un rappel relatif sans échéance, et une date précise vide', () => {
    const relative = taskFormSchema.safeParse({ ...BASE, dueDate: '', reminder: 'HOUR_BEFORE' })
    expect(relative.error?.issues[0]).toMatchObject({ path: ['reminder'], message: 'validation.reminder.needsDueDate' })
    const custom = taskFormSchema.safeParse({ ...BASE, reminder: 'CUSTOM' })
    expect(custom.error?.issues[0]).toMatchObject({ path: ['reminderAt'], message: 'validation.reminder.required' })
  })
})

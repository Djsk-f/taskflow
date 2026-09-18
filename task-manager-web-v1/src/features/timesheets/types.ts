import type { TaskStatus } from '@/features/tasks/types'

export type TimeEntry = {
  id: number
  taskId: number
  taskTitle: string
  taskStatus: TaskStatus
  /** Jour travaillé, `YYYY-MM-DD`, sans fuseau. */
  workDate: string
  durationMinutes: number
  note?: string
  createdAt: string
  updatedAt: string
}

export type TimeEntryPayload = {
  taskId: number
  workDate: string
  durationMinutes: number
  note?: string
}

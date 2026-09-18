import type { TimeEntry, TimeEntryPayload } from '@/features/timesheets/types'
import { httpClient } from '@/shared/api/httpClient'

export const timeEntryApi = {
  async list(from: string, to: string): Promise<TimeEntry[]> {
    const { data } = await httpClient.get<TimeEntry[]>('/time-entries', { params: { from, to } })
    return data
  },

  async listForTask(taskId: number): Promise<TimeEntry[]> {
    const { data } = await httpClient.get<TimeEntry[]>(`/tasks/${taskId}/time-entries`)
    return data
  },

  async create(payload: TimeEntryPayload): Promise<TimeEntry> {
    const { data } = await httpClient.post<TimeEntry>('/time-entries', payload)
    return data
  },

  async update(id: number, payload: TimeEntryPayload): Promise<TimeEntry> {
    const { data } = await httpClient.put<TimeEntry>(`/time-entries/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await httpClient.delete(`/time-entries/${id}`)
  },
}

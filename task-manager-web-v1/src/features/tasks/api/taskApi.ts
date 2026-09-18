import type { Task, TaskFilters, TaskPayload, TaskStats, TaskStatus } from '@/features/tasks/types'
import { httpClient } from '@/shared/api/httpClient'
import type { PageResponse } from '@/shared/types/api'

export const taskApi = {
  async list(filters: TaskFilters): Promise<PageResponse<Task>> {
    const { data } = await httpClient.get<PageResponse<Task>>('/tasks', {
      params: {
        search: filters.search || undefined,
        status: filters.status ?? undefined,
        priority: filters.priority ?? undefined,
        page: filters.page,
        size: filters.size,
      },
    })
    return data
  },

  async create(payload: TaskPayload): Promise<Task> {
    const { data } = await httpClient.post<Task>('/tasks', payload)
    return data
  },

  async update(id: number, payload: TaskPayload): Promise<Task> {
    const { data } = await httpClient.put<Task>(`/tasks/${id}`, payload)
    return data
  },

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const { data } = await httpClient.patch<Task>(`/tasks/${id}/status`, { status })
    return data
  },

  async stats(): Promise<TaskStats> {
    const { data } = await httpClient.get<TaskStats>('/tasks/stats')
    return data
  },

  /** Tâches non terminées en retard ou à échéance dans la fenêtre donnée (heures). */
  async due(withinHours: number): Promise<Task[]> {
    const { data } = await httpClient.get<Task[]>('/tasks/due', { params: { withinHours } })
    return data
  },

  async remove(id: number): Promise<void> {
    await httpClient.delete(`/tasks/${id}`)
  },
}

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
        due: filters.due ?? undefined,
        sort: `${filters.sort.field},${filters.sort.direction}`,
        page: filters.page,
        size: filters.size,
      },
    })
    return data
  },

  /** Suggestions du champ « Ajouter une tâche » de la feuille de temps : 10 au plus, par titre. */
  async suggest(search: string): Promise<Task[]> {
    const { data } = await httpClient.get<PageResponse<Task>>('/tasks', {
      params: { search: search || undefined, page: 0, size: 10, sort: 'title,asc' },
    })
    return data.content
  },

  async get(id: number): Promise<Task> {
    const { data } = await httpClient.get<Task>(`/tasks/${id}`)
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

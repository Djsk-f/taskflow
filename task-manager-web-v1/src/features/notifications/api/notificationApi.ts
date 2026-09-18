import type { AppNotification } from '@/features/notifications/types'
import { httpClient } from '@/shared/api/httpClient'
import type { PageResponse } from '@/shared/types/api'

export const notificationApi = {
  async list(page: number, size: number): Promise<PageResponse<AppNotification>> {
    const { data } = await httpClient.get<PageResponse<AppNotification>>('/notifications', { params: { page, size } })
    return data
  },

  async unreadCount(): Promise<number> {
    const { data } = await httpClient.get<{ count: number }>('/notifications/unread-count')
    return data.count
  },

  async markRead(id: number): Promise<void> {
    await httpClient.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await httpClient.post('/notifications/read-all')
  },
}

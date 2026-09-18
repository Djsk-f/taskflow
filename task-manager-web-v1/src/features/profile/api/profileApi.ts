import type { UserProfile } from '@/features/auth/types'
import type { ProfileValues } from '@/features/profile/schemas'
import { httpClient } from '@/shared/api/httpClient'

export const profileApi = {
  async update(values: ProfileValues): Promise<UserProfile> {
    const { data } = await httpClient.patch<UserProfile>('/users/me', values)
    return data
  },

  async changePassword(values: { currentPassword: string; newPassword: string }): Promise<void> {
    await httpClient.put('/users/me/password', values)
  },
}

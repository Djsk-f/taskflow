import type { AuthResponse, UserProfile } from '@/features/auth/types'
import type { LoginValues, RegisterValues } from '@/features/auth/schemas'
import { httpClient } from '@/shared/api/httpClient'

export const authApi = {
  async register(values: RegisterValues): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/auth/register', values)
    return data
  },

  async login(values: LoginValues): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/auth/login', values)
    return data
  },

  async me(): Promise<UserProfile> {
    const { data } = await httpClient.get<UserProfile>('/users/me')
    return data
  },
}

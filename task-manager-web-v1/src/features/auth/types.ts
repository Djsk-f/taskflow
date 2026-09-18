export type UserProfile = {
  id: number
  fullName: string
  email: string
  createdAt: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserProfile
}

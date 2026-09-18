import { authApi } from '@/features/auth/api/authApi'
import type { LoginValues, RegisterValues } from '@/features/auth/schemas'
import { tokenStorage } from '@/features/auth/tokenStorage'
import type { UserProfile } from '@/features/auth/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { setUnauthorizedHandler } from '@/shared/api/httpClient'
import axios from 'axios'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AuthState = {
  user: UserProfile | null
  isAuthenticated: boolean
  /** Vrai pendant la restauration de session au premier rendu. */
  isRestoring: boolean
  /** Vrai après une déconnexion forcée par le serveur (jeton expiré) : la connexion l'explique. */
  sessionExpired: boolean
  /** Message si la session n'a pas pu être vérifiée (serveur injoignable, 5xx). */
  restoreError: string | null
  retryRestore: () => void
  login: (values: LoginValues) => Promise<void>
  register: (values: RegisterValues) => Promise<void>
  logout: () => void
  updateUser: (user: UserProfile) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setSessionExpired(false)
    setUser(null)
  }, [])

  // Une session expirée détectée par le client HTTP doit vider l'état applicatif :
  // sans cela l'interface afficherait un utilisateur connecté qui ne l'est plus. La page
  // de connexion dit pourquoi, au lieu d'une déconnexion muette.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true)
      setUser(null)
    })
  }, [])

  // Restauration au chargement : un jeton en stockage ne prouve rien, on le confronte
  // au serveur (ADR-023). Seul un 401 invalide la session — le client HTTP purge alors le
  // jeton. Un serveur injoignable ou en erreur ne dit rien du jeton : on le conserve et
  // on propose de réessayer, au lieu de déconnecter l'utilisateur pour une coupure réseau.
  const restoreSession = useCallback(() => {
    if (!tokenStorage.read()) {
      setIsRestoring(false)
      return
    }
    setIsRestoring(true)
    setRestoreError(null)
    authApi
      .me()
      .then(setUser)
      .catch((error: unknown) => {
        if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
          setRestoreError(extractApiError(error).message)
        }
      })
      .finally(() => setIsRestoring(false))
  }, [])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const applyAuthResponse = useCallback(async (request: Promise<{ accessToken: string; user: UserProfile }>) => {
    const response = await request
    tokenStorage.write(response.accessToken)
    setSessionExpired(false)
    setUser(response.user)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isRestoring,
      sessionExpired,
      restoreError,
      retryRestore: restoreSession,
      login: (values) => applyAuthResponse(authApi.login(values)),
      register: (values) => applyAuthResponse(authApi.register(values)),
      logout,
      updateUser: setUser,
    }),
    [user, isRestoring, sessionExpired, restoreError, restoreSession, applyAuthResponse, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

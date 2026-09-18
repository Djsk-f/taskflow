import { tokenStorage } from '@/features/auth/tokenStorage'
import { env } from '@/shared/config/env'
import { currentLanguage } from '@/shared/i18n/i18n'
import type { ApiErrorResponse } from '@/shared/types/api'
import axios, { type AxiosError } from 'axios'

/**
 * UNIQUE client HTTP de l'application (INV-21). Il porte l'URL de base, l'en-tête
 * d'authentification et la réaction à une session expirée. Aucun composant n'appelle
 * axios ou fetch directement — scripts/brain-check.sh le vérifie.
 */
export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let unauthorizedHandler: (() => void) | null = null
const sessionExpiredListeners = new Set<() => void>()

/** Branché une seule fois par AuthProvider, pour éviter un import circulaire. */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

/**
 * Prévient un composant qu'une session vient d'expirer, AVANT la déconnexion : un
 * formulaire ouvert peut encore lire sa saisie et la mettre de côté. N'importe quelle
 * requête peut révéler l'expiration (la cloche interroge le serveur chaque minute), pas
 * seulement l'envoi du formulaire. Renvoie la fonction de désabonnement.
 */
export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.read()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // L'API répond dans la langue de l'interface (messages d'erreur, validation).
  config.headers['Accept-Language'] = currentLanguage()
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && isSessionExpired(error)) {
      tokenStorage.clear()
      sessionExpiredListeners.forEach((listener) => listener())
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

/** Vrai si l'erreur vient d'une session expirée (le client a déjà déconnecté l'utilisateur). */
export function isSessionExpiredError(error: unknown): boolean {
  return axios.isAxiosError(error) && isSessionExpired(error)
}

/**
 * Seul un 401 qui n'est PAS `INVALID_CREDENTIALS` signifie une session expirée.
 * `INVALID_CREDENTIALS` est une réponse métier normale — identifiants de connexion ou
 * mot de passe actuel erroné sur le profil — et ne doit jamais déconnecter l'utilisateur.
 */
function isSessionExpired(error: AxiosError<ApiErrorResponse>): boolean {
  return error.response?.status === 401 && error.response.data?.code !== 'INVALID_CREDENTIALS'
}

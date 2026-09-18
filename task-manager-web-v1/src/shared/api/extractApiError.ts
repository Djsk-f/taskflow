import type { ApiErrorResponse, ApiFieldError } from '@/shared/types/api'
import axios from 'axios'

export type ExtractedApiError = {
  message: string
  code?: ApiErrorResponse['code']
  fieldErrors: ApiFieldError[]
}

const NETWORK_MESSAGE = "Le serveur est injoignable. Vérifier qu'il est démarré, puis réessayer."
const FALLBACK_MESSAGE = 'Une erreur inattendue est survenue.'

/**
 * Traduction unique d'une erreur HTTP en message affichable (INV-21) : tout écran affiche
 * le `message` du serveur, jamais un « [object Object] » ni un statut brut.
 */
export function extractApiError(error: unknown): ExtractedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const body = error.response?.data
    if (body?.message) {
      return { message: body.message, code: body.code, fieldErrors: body.fieldErrors ?? [] }
    }
    if (!error.response) {
      return { message: NETWORK_MESSAGE, fieldErrors: [] }
    }
  }
  return { message: FALLBACK_MESSAGE, fieldErrors: [] }
}

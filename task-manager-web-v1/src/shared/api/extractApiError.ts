import type { ApiErrorResponse, ApiFieldError } from '@/shared/types/api'
import { i18n } from '@/shared/i18n/i18n'
import axios from 'axios'

export type ExtractedApiError = {
  message: string
  code?: ApiErrorResponse['code']
  fieldErrors: ApiFieldError[]
}

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
      return { message: i18n.t('errors.network'), fieldErrors: [] }
    }
  }
  return { message: i18n.t('errors.unexpected'), fieldErrors: [] }
}

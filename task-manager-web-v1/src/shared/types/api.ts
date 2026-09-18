/**
 * Types du contrat d'API — miroir exact de .brain/05-CONTRAT-API.md.
 * Toute divergence ici est un bug : le contrat est verrouillé côté serveur.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'EMAIL_ALREADY_USED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'

export type ApiFieldError = {
  field: string
  message: string
}

export type ApiErrorResponse = {
  timestamp: string
  status: number
  code: ApiErrorCode
  message: string
  path: string
  /** Présent uniquement sur les erreurs de validation. */
  fieldErrors?: ApiFieldError[]
}

/**
 * Enveloppe de pagination du serveur. Les champs optionnels du serveur sont omis et non
 * nuls (sérialisation `non_null`), d'où les `?` dans les types de ressources.
 */
export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

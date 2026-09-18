import { QueryClient } from '@tanstack/react-query'

/**
 * Configuration de l'état serveur (ADR-016). Un 401 ou un 404 ne se réessaie pas : le
 * client HTTP a déjà traité la session expirée, et une ressource absente le reste.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

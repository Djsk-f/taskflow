import { notificationApi } from '@/features/notifications/api/notificationApi'
import { PREFERENCES_QUERY_KEY } from '@/features/notifications/hooks/useNotifications'
import { useAuth } from '@/features/auth/useAuth'
import { currentLanguage, i18n } from '@/shared/i18n/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * Les e-mails partent dans la langue enregistrée sur le compte : elle suit donc le choix
 * fait dans l'interface. Sans cela, une anglophone recevrait son récapitulatif en français.
 * Un échec est sans conséquence visible : la langue sera renvoyée au prochain changement.
 */
export function useLanguageSync() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    const sync = async () => {
      const language = currentLanguage()
      const preferences = await queryClient.fetchQuery({
        queryKey: PREFERENCES_QUERY_KEY,
        queryFn: notificationApi.preferences,
      })
      if (preferences.language !== language) {
        const saved = await notificationApi.updatePreferences({ ...preferences, language })
        queryClient.setQueryData(PREFERENCES_QUERY_KEY, saved)
      }
    }
    const onChange = () => void sync().catch(() => undefined)
    onChange()
    i18n.on('languageChanged', onChange)
    return () => i18n.off('languageChanged', onChange)
  }, [isAuthenticated, queryClient])
}

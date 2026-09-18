import {
  disableBrowserNotifications,
  enableBrowserNotifications,
  useBrowserNotificationState,
} from '@/features/notifications/browserNotifications'
import { notificationApi } from '@/features/notifications/api/notificationApi'
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications'
import type { NotificationPreferences } from '@/features/notifications/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { Skeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const PREFERENCE_KEYS = ['dueIn24h', 'dueIn1h', 'overdue', 'dailyTimeReminder'] as const satisfies readonly (keyof NotificationPreferences)[]
const PREFERENCES_QUERY_KEY = [NOTIFICATIONS_QUERY_KEY, 'preferences']

/**
 * Réglages des notifications dans le profil : rappels automatiques (enregistrés sur le
 * compte, effet immédiat) et notifications du navigateur (propres à cet appareil).
 */
export function NotificationPreferencesCard() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { data, isPending, isError, error } = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: notificationApi.preferences,
  })
  const save = useMutation({
    mutationFn: notificationApi.updatePreferences,
    // Bascule immédiate ; en cas de refus, l'état du serveur est rétabli.
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEY })
      const previous = queryClient.getQueryData<NotificationPreferences>(PREFERENCES_QUERY_KEY)
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, next)
      return { previous }
    },
    onError: (saveError, _next, context) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, context?.previous)
      toast.error(extractApiError(saveError).message)
    },
    onSuccess: () => toast.success(t('notifications.preferences.saved')),
  })

  if (isPending) {
    return <Skeleton className="h-56 rounded-xl" />
  }
  if (isError) {
    return <p className="text-destructive text-sm">{extractApiError(error).message}</p>
  }

  return (
    <div className="divide-y">
      {PREFERENCE_KEYS.map((key) => (
        <PreferenceRow
          key={key}
          label={t(`notifications.preferences.${key}.label`)}
          hint={t(`notifications.preferences.${key}.hint`)}
          checked={data[key]}
          onChange={(checked) => save.mutate({ ...data, [key]: checked })}
        />
      ))}
      <BrowserNotificationsRow />
    </div>
  )
}

function BrowserNotificationsRow() {
  const state = useBrowserNotificationState()
  const { t } = useTranslation()
  if (state === 'unsupported') {
    return null
  }
  return (
    <PreferenceRow
      label={t('notifications.preferences.browser.label')}
      hint={state === 'denied' ? t('notifications.browser.denied') : t('notifications.preferences.browser.hint')}
      checked={state === 'on'}
      disabled={state === 'denied'}
      onChange={async (checked) => {
        if (!checked) {
          disableBrowserNotifications()
        } else if ((await enableBrowserNotifications()) !== 'on') {
          toast.error(t('notifications.browser.denied'))
        }
      }}
    />
  )
}

type PreferenceRowProps = {
  label: string
  hint: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function PreferenceRow({ label, hint, checked, disabled = false, onChange }: PreferenceRowProps) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-hint`} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

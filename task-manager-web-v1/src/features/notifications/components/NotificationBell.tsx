import {
  disableBrowserNotifications,
  enableBrowserNotifications,
  useBrowserNotificationState,
} from '@/features/notifications/browserNotifications'
import { useBrowserNotifications } from '@/features/notifications/hooks/useBrowserNotifications'
import {
  useLatestNotifications,
  useNotificationActions,
  useNotificationFeed,
  useUnreadCount,
} from '@/features/notifications/hooks/useNotifications'
import { NOTIFICATION_META, notificationLink } from '@/features/notifications/notificationMeta'
import type { AppNotification } from '@/features/notifications/types'
import { formatShortDateTime } from '@/shared/lib/formatDate'
import { formatRelative } from '@/shared/lib/formatRelative'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { BellIcon, BellOffIcon, BellRingIcon, CheckCheckIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/**
 * Cloche de l'en-tête : rappels générés par le serveur (échéance sous 24 h, sous 1 h,
 * retard, rappel choisi, saisie du temps), non lus en tête de badge. Choisir une notification la marque comme lue et
 * ouvre la tâche. Les nouvelles sont aussi relayées au système si l'utilisateur l'a permis.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unread = 0 } = useUnreadCount()
  const latest = useLatestNotifications()
  const feed = useNotificationFeed(open)
  const { markRead, markAllRead } = useNotificationActions()
  const navigate = useNavigate()
  const { t } = useTranslation()
  useBrowserNotifications(latest.data?.content)

  const notifications = feed.data?.pages.flatMap((page) => page.content) ?? []

  const openNotification = (notification: AppNotification) => {
    setOpen(false)
    if (!notification.read) {
      markRead.mutate(notification.id)
    }
    navigate(notificationLink(notification))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative"
          aria-label={unread > 0 ? t('notifications.labelUnread', { count: unread }) : t('notifications.label')}
        >
          <BellIcon className="size-5" />
          {unread > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b py-2 pr-2 pl-4">
          <p className="text-sm font-semibold">{t('notifications.title')}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheckIcon className="size-4" />
            {t('notifications.markAllRead')}
          </Button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto">
          {feed.isError && <p className="text-destructive px-4 py-6 text-center text-sm">{t('notifications.unavailable')}</p>}

          {feed.isPending && <p className="text-muted-foreground px-4 py-6 text-center text-sm">{t('common.loading')}</p>}

          {feed.isSuccess && notifications.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-8 text-center text-sm">
              <BellOffIcon className="size-6" />
              <p className="text-foreground font-medium">{t('notifications.empty.title')}</p>
              <p>{t('notifications.empty.description')}</p>
            </div>
          )}

          {notifications.length > 0 && (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem notification={notification} onSelect={openNotification} />
                </li>
              ))}
            </ul>
          )}

          {feed.hasNextPage && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                className="text-primary w-full"
                disabled={feed.isFetchingNextPage}
                onClick={() => feed.fetchNextPage()}
              >
                {feed.isFetchingNextPage ? t('common.loading') : t('common.showMore')}
              </Button>
            </div>
          )}
        </div>

        <BrowserNotificationsFooter />
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: AppNotification
  onSelect: (notification: AppNotification) => void
}) {
  const { t } = useTranslation()
  const meta = NOTIFICATION_META[notification.type]
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        'hover:bg-accent focus-visible:bg-accent flex w-full items-start gap-3 px-4 py-3 text-left outline-none',
        !notification.read && 'bg-secondary/40',
      )}
    >
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', meta.toneClassName)}>
        <meta.icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('text-sm', !notification.read && 'font-semibold')}>{t(meta.labelKey)}</span>
          <span className="text-muted-foreground shrink-0 text-xs">{formatRelative(notification.createdAt)}</span>
        </span>
        <span className="text-foreground/90 block text-sm [overflow-wrap:anywhere]">
          {notification.taskTitle ?? t('notifications.noTimeHint')}
        </span>
        {meta.subjectKey && (
          <span className="text-muted-foreground block text-xs">
            {t(meta.subjectKey, { date: formatShortDateTime(notification.subjectAt) })}
          </span>
        )}
      </span>
      {!notification.read && (
        <span className="bg-primary mt-2 size-2 shrink-0 rounded-full">
          <span className="sr-only">{t('notifications.unread')}</span>
        </span>
      )}
    </button>
  )
}

/** Proposer les notifications du navigateur là où l'on regarde ses notifications. */
function BrowserNotificationsFooter() {
  const state = useBrowserNotificationState()
  const { t } = useTranslation()
  if (state === 'unsupported') {
    return null
  }
  return (
    <div className="text-muted-foreground flex items-center gap-2 border-t px-4 py-2 text-xs">
      <BellRingIcon className="size-4 shrink-0" />
      {state === 'denied' && <span>{t('notifications.browser.denied')}</span>}
      {state === 'on' && (
        <>
          <span className="flex-1">{t('notifications.browser.on')}</span>
          <Button variant="ghost" size="sm" onClick={disableBrowserNotifications}>
            {t('notifications.browser.disable')}
          </Button>
        </>
      )}
      {state === 'off' && (
        <>
          <span className="flex-1">{t('notifications.browser.pitch')}</span>
          <Button variant="outline" size="sm" onClick={() => void enableBrowserNotifications()}>
            {t('notifications.browser.enable')}
          </Button>
        </>
      )}
    </div>
  )
}

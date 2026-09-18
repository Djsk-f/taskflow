import { useSyncExternalStore } from 'react'

/**
 * Notifications du navigateur (système), sur choix explicite de l'utilisateur : le
 * navigateur demande l'autorisation, puis la préférence est retenue sur cet appareil.
 * `unsupported` : navigateur sans l'API ; `denied` : refusées dans les réglages du site.
 */
export type BrowserNotificationState = 'unsupported' | 'denied' | 'off' | 'on'

const PREFERENCE_KEY = 'taskflow.browserNotifications'
const listeners = new Set<() => void>()

const isSupported = () => typeof window !== 'undefined' && 'Notification' in window

function readPreference(): boolean {
  try {
    return localStorage.getItem(PREFERENCE_KEY) === 'on'
  } catch {
    return false
  }
}

function writePreference(on: boolean): void {
  try {
    localStorage.setItem(PREFERENCE_KEY, on ? 'on' : 'off')
  } catch {
    // stockage indisponible : la préférence ne survivra pas au rechargement
  }
  listeners.forEach((listener) => listener())
}

export function browserNotificationState(): BrowserNotificationState {
  if (!isSupported()) {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  return Notification.permission === 'granted' && readPreference() ? 'on' : 'off'
}

export async function enableBrowserNotifications(): Promise<BrowserNotificationState> {
  if (!isSupported()) {
    return 'unsupported'
  }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  writePreference(permission === 'granted')
  return browserNotificationState()
}

export function disableBrowserNotifications(): void {
  writePreference(false)
}

export function useBrowserNotificationState(): BrowserNotificationState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    browserNotificationState,
    () => 'unsupported',
  )
}

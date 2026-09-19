import { tokenStorage } from '@/features/auth/tokenStorage'
import { env } from '@/shared/config/env'

type StreamHandlers = {
  /** Le serveur signale du nouveau : les listes de notifications sont à recharger. */
  onEvent: () => void
  onConnectionChange: (connected: boolean) => void
}

/** Au-delà, inutile de s'acharner : l'interrogation régulière prend le relais. */
const MAX_BACKOFF_MS = 30_000

/**
 * Flux temps réel des notifications (Server-Sent Events), lu avec `fetch` pour garder le
 * jeton dans l'en-tête `Authorization` : `EventSource` ne sait pas en envoyer, et le
 * mettre dans l'URL le ferait apparaître dans les journaux du serveur.
 *
 * Toute coupure (réseau, mandataire, redémarrage de l'API) est normale : on se reconnecte
 * avec un délai croissant, et l'appelant repasse en interrogation régulière entre-temps.
 * Renvoie la fonction d'arrêt.
 */
export function openNotificationStream({ onEvent, onConnectionChange }: StreamHandlers): () => void {
  const controller = new AbortController()
  let attempt = 0

  const loop = async () => {
    while (!controller.signal.aborted) {
      try {
        const token = tokenStorage.read()
        if (!token) {
          return
        }
        const response = await fetch(`${env.VITE_API_BASE_URL}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        })
        if (!response.ok || !response.body) {
          throw new Error(`flux indisponible (${response.status})`)
        }
        attempt = 0
        onConnectionChange(true)
        await readEvents(response.body, onEvent, controller.signal)
      } catch {
        // coupure attendue : on retente plus bas
      }
      onConnectionChange(false)
      if (controller.signal.aborted) {
        return
      }
      await wait(Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++), controller.signal)
    }
  }

  void loop()
  return () => controller.abort()
}

/** Découpe le flux en événements : une ligne `data:` = un signal (les `:` sont des battements). */
async function readEvents(body: ReadableStream<Uint8Array>, onEvent: () => void, signal: AbortSignal) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (!signal.aborted) {
    const { value, done } = await reader.read()
    if (done) {
      return
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    lines.filter((line) => line.startsWith('data:')).forEach(() => onEvent())
  }
}

function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, delayMs)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    }, { once: true })
  })
}

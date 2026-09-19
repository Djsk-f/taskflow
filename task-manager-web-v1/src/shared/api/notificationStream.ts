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
 * Silence maximal toléré. Le serveur envoie un battement toutes les 25 s : au-delà d'une
 * minute sans rien, la connexion est morte sans l'avoir dit (mandataire qui garde la
 * socket ouverte, machine réveillée après une mise en veille…). On la referme pour en
 * rouvrir une, au lieu de rester à attendre indéfiniment.
 */
const SILENCE_TIMEOUT_MS = 60_000

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
      // Une tentative peut être interrompue par l'appelant ou par le chien de garde.
      const attemptController = new AbortController()
      const abortAttempt = () => attemptController.abort()
      controller.signal.addEventListener('abort', abortAttempt, { once: true })
      let watchdog: ReturnType<typeof setTimeout> | undefined
      const keepAlive = () => {
        clearTimeout(watchdog)
        watchdog = setTimeout(abortAttempt, SILENCE_TIMEOUT_MS)
      }

      try {
        const token = tokenStorage.read()
        if (!token) {
          return
        }
        keepAlive()
        const response = await fetch(`${env.VITE_API_BASE_URL}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: attemptController.signal,
        })
        if (!response.ok || !response.body) {
          throw new Error(`flux indisponible (${response.status})`)
        }
        attempt = 0
        onConnectionChange(true)
        await readEvents(response.body, onEvent, keepAlive, attemptController.signal)
      } catch {
        // coupure attendue : on retente plus bas
      } finally {
        clearTimeout(watchdog)
        controller.signal.removeEventListener('abort', abortAttempt)
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
async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: () => void,
  keepAlive: () => void,
  signal: AbortSignal,
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (!signal.aborted) {
    const { value, done } = await reader.read()
    if (done) {
      return
    }
    // Battement compris : toute donnée reçue prouve que la connexion est vivante.
    keepAlive()
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

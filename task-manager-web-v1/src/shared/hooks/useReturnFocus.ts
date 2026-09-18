import { useRef } from 'react'

type AutoFocusHandler = (event: Event) => void

/**
 * Rend le focus à l'élément qui l'avait avant l'ouverture d'une modale.
 * Radix ne le fait que pour son propre `Trigger` ; nos modales s'ouvrent par état (bouton
 * d'en-tête, élément de menu, bouton burger), sans `Trigger` : sans ce hook, le focus
 * retombe sur <body> et l'utilisateur au clavier perd sa position.
 */
export function useReturnFocus(onOpenAutoFocus?: AutoFocusHandler, onCloseAutoFocus?: AutoFocusHandler) {
  const previous = useRef<HTMLElement | null>(null)

  return {
    onOpenAutoFocus: (event: Event) => {
      previous.current = focusOrigin()
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      if (!event.defaultPrevented && previous.current?.isConnected) {
        event.preventDefault()
        previous.current.focus()
      }
    },
  }
}

/**
 * Élément à qui rendre le focus. Une modale ouverte depuis un menu déroulant (« Modifier »,
 * « Supprimer ») est ouverte depuis un élément de menu qui va disparaître : on retient
 * alors le bouton qui a ouvert le menu, que Radix désigne par `aria-labelledby`.
 */
function focusOrigin(): HTMLElement | null {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) {
    return null
  }
  const menuTriggerId = active.closest('[role=menu]')?.getAttribute('aria-labelledby')
  return (menuTriggerId && document.getElementById(menuTriggerId)) || active
}

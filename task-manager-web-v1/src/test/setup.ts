import '@testing-library/jest-dom/vitest'
import { i18n } from '@/shared/i18n/i18n'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

/**
 * jsdom n'implémente pas ResizeObserver, qu'utilise le positionnement des menus et
 * panneaux Radix. Un substitut inerte suffit : les tests ne mesurent pas de mise en page.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub

// Langue de référence des tests : le français, sauf changement explicite dans un test.
beforeEach(async () => {
  await i18n.changeLanguage('fr')
})

afterEach(() => cleanup())

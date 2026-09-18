import { pageItems } from '@/shared/lib/pageItems'
import { describe, expect, it } from 'vitest'

// Affichage en base 1 pour la lisibilité des attentes.
const display = (current: number, total: number) =>
  pageItems(current, total).map((item) => (item === 'gap' ? '…' : item + 1))

describe('pageItems', () => {
  it('liste toutes les pages quand il y en a peu', () => {
    expect(display(0, 1)).toEqual([1])
    expect(display(2, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('encadre la page courante de points de suspension', () => {
    expect(display(5, 12)).toEqual([1, '…', 5, 6, 7, '…', 12])
  })

  it('garde sept éléments près des bords', () => {
    expect(display(0, 12)).toEqual([1, 2, 3, 4, 5, '…', 12])
    expect(display(11, 12)).toEqual([1, '…', 8, 9, 10, 11, 12])
    expect(display(2, 12)).toEqual([1, 2, 3, 4, 5, '…', 12])
  })
})

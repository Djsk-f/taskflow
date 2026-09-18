import { addDays, fromIsoDate, startOfWeek, toIsoDate, weekDays } from '@/shared/lib/week'
import { describe, expect, it } from 'vitest'

describe('semaines de la feuille de temps', () => {
  it('commencent le lundi, y compris depuis un dimanche', () => {
    expect(toIsoDate(startOfWeek(fromIsoDate('2026-09-20')))).toBe('2026-09-14') // dimanche
    expect(toIsoDate(startOfWeek(fromIsoDate('2026-09-14')))).toBe('2026-09-14') // lundi
    expect(toIsoDate(startOfWeek(fromIsoDate('2026-09-18')))).toBe('2026-09-14') // vendredi
  })

  it('comptent sept jours consécutifs', () => {
    const days = weekDays(fromIsoDate('2026-09-14')).map(toIsoDate)
    expect(days).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'])
  })

  it('franchissent les fins de mois et d’année sans décalage de fuseau', () => {
    expect(toIsoDate(addDays(fromIsoDate('2026-12-28'), 7))).toBe('2027-01-04')
    expect(toIsoDate(fromIsoDate('2026-03-29'))).toBe('2026-03-29') // passage à l'heure d'été
  })
})

import { i18n } from '@/shared/i18n/i18n'
import { formatDuration, parseDuration } from '@/shared/lib/duration'
import { describe, expect, it } from 'vitest'

describe('parseDuration', () => {
  it.each([
    ['1h30', 90],
    ['1h', 60],
    ['1H30', 90],
    ['0h30', 30],
    ['45m', 45],
    ['45 min', 45],
    ['90m', 90],
    ['1:30', 90],
    ['1.5', 90],
    ['1,5', 90],
    ['2', 120],
    ['24', 1440],
  ])('lit « %s » comme %i minutes', (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes)
  })

  it.each(['', '0', '25', '24h01', 'abc', '1h75', '1:75', '-1'])('refuse « %s »', (input) => {
    expect(parseDuration(input)).toBeNull()
  })
})

describe('formatDuration', () => {
  it('suit la langue de l’interface', async () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(120)).toBe('2 h')
    expect(formatDuration(95)).toBe('1 h 35')

    await i18n.changeLanguage('en')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(95)).toBe('1h 35m')
  })
})

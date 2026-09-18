import { i18n } from '@/shared/i18n/i18n'
import { formatRelative } from '@/shared/lib/formatRelative'
import { afterEach, describe, expect, it } from 'vitest'

const NOW = Date.parse('2026-09-18T10:00:00Z')

describe('formatRelative', () => {
  afterEach(() => i18n.changeLanguage('fr'))

  // Intl sépare par des espaces insécables (typographie française) : \s les accepte.
  it('choisit l’unité la plus parlante, dans la langue de l’interface', async () => {
    await i18n.changeLanguage('fr')
    expect(formatRelative('2026-09-18T09:55:00Z', NOW)).toMatch(/il\sy\sa\s5\smin/)
    expect(formatRelative('2026-09-18T07:00:00Z', NOW)).toMatch(/il\sy\sa\s3\sh/)
    expect(formatRelative('2026-09-17T10:00:00Z', NOW)).toBe('hier')
    await i18n.changeLanguage('en')
    expect(formatRelative('2026-09-18T09:59:40Z', NOW)).toBe('just now')
  })
})

import { i18n } from '@/shared/i18n/i18n'
import { en } from '@/shared/i18n/locales/en'
import { fr } from '@/shared/i18n/locales/fr'
import { translateMessage } from '@/shared/i18n/translateMessage'
import { describe, expect, it } from 'vitest'

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? { ...all, [path]: value } : { ...all, ...leaves(value, path) }
  }, {})
}

describe('dictionnaires', () => {
  it('ont exactement les mêmes clés, sans texte vide', () => {
    const french = leaves(fr)
    const english = leaves(en)
    expect(Object.keys(english).sort()).toEqual(Object.keys(french).sort())
    expect(Object.entries({ ...french, ...english }).filter(([, text]) => text.trim() === '')).toEqual([])
  })
})

describe('translateMessage', () => {
  it('traduit les clés de validation et laisse intacts les messages du serveur', async () => {
    const t = i18n.t.bind(i18n)
    expect(translateMessage(t, 'validation.title.required')).toBe('Le titre est obligatoire.')
    // Un message serveur contient « : » : il ne doit pas être pris pour un espace de noms.
    expect(translateMessage(t, 'Authentification requise : jeton absent.')).toBe('Authentification requise : jeton absent.')

    await i18n.changeLanguage('en')
    expect(translateMessage(i18n.t.bind(i18n), 'validation.title.required')).toBe('Title is required.')
  })
})

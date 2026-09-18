import { en } from '@/shared/i18n/locales/en'
import { fr } from '@/shared/i18n/locales/fr'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Traduction de l'interface (français / anglais). Au premier chargement, la langue est
 * celle du navigateur (anglais pour un navigateur anglophone, français sinon) ; le choix
 * de l'utilisateur est ensuite mémorisé. La même langue est envoyée à l'API
 * (Accept-Language, voir httpClient) pour que ses messages suivent.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'fr',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'taskflow.language',
      caches: ['localStorage'],
    },
    // Les messages du serveur contiennent « : » : ce n'est jamais un espace de noms.
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  })

/** Langue courante, ramenée à une langue prise en charge (ex. « en-US » → « en »). */
export function currentLanguage(): Language {
  const language = i18n.resolvedLanguage ?? i18n.language
  return language?.startsWith('en') ? 'en' : 'fr'
}

// <html lang> suit la langue : lecteurs d'écran, césure, correcteurs.
const syncHtmlLang = () => document.documentElement.setAttribute('lang', currentLanguage())
syncHtmlLang()
i18n.on('languageChanged', syncHtmlLang)

export { i18n }

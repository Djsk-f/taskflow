import type { fr } from '@/shared/i18n/locales/fr'
import 'i18next'

/** Clés de traduction vérifiées à la compilation : `t('tasks.creat')` ne compile pas. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof fr }
  }
}

import { currentLanguage, SUPPORTED_LANGUAGES } from '@/shared/i18n/i18n'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from 'react-i18next'

/** Bascule FR | EN, mémorisée ; présente dans la barre latérale et sur les écrans de connexion. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const active = currentLanguage()

  return (
    <div role="group" aria-label={t('language.label')} className={cn('bg-muted inline-flex rounded-lg p-0.5', className)}>
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={active === language}
          aria-label={t(`language.${language}`)}
          onClick={() => void i18n.changeLanguage(language)}
          className={cn(
            'focus-visible:ring-ring/50 min-h-10 min-w-10 rounded-md px-2 text-xs font-semibold uppercase transition-colors outline-none focus-visible:ring-[3px]',
            active === language ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {language}
        </button>
      ))}
    </div>
  )
}

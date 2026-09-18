import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Affiché pendant la restauration de session, avant de savoir si l'on est connecté. */
export function FullPageLoader({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        <span>{label ?? t('common.loading')}</span>
      </div>
    </div>
  )
}

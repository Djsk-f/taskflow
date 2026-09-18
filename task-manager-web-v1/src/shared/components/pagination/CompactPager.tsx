import { Button } from '@/shared/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Pager discret « ‹ 1 / 3 › » pour les blocs du tableau de bord ; rien s'il n'y a qu'une page. */
export function CompactPager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (totalPages <= 1) {
    return null
  }
  return (
    <nav aria-label={t('common.pagination.label')} className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        aria-label={t('common.pagination.previous')}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <span className="text-muted-foreground min-w-12 text-center text-xs tabular-nums" aria-live="polite">
        {t('common.pagination.compact', { page: page + 1, pages: totalPages })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label={t('common.pagination.next')}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  )
}

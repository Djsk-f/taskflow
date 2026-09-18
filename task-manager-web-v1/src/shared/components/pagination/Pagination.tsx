import { pageItems } from '@/shared/lib/pageItems'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type PaginationProps = {
  /** Page courante, base 0. */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Libellé de plage déjà traduit, ex. « 11–20 sur 35 tâches ». */
  rangeLabel: string
  pageSize?: number
  pageSizes?: readonly number[]
  onPageSizeChange?: (size: number) => void
}

/**
 * Pagination des listes : plage affichée, pages numérotées avec points de suspension,
 * précédente / suivante, et choix du nombre d'éléments par page. Sur mobile, les
 * numéros laissent place à « 3 / 12 » pour tenir sur une ligne.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  rangeLabel,
  pageSize,
  pageSizes,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation()
  const pages = Math.max(totalPages, 1)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span aria-live="polite">{rangeLabel}</span>
        {pageSize !== undefined && pageSizes && onPageSizeChange && (
          <label className="flex items-center gap-2">
            {t('common.pagination.pageSize')}
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="bg-card w-20" aria-label={t('common.pagination.pageSizeLabel')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>

      <nav aria-label={t('common.pagination.label')} className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('common.pagination.previous')}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {pageItems(page, pages).map((item, index) =>
            item === 'gap' ? (
              <li key={`gap-${index}`} aria-hidden="true" className="text-muted-foreground w-8 text-center text-sm">
                …
              </li>
            ) : (
              <li key={item}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPageChange(item)}
                  aria-label={t('common.pagination.page', { page: item + 1 })}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'text-sm tabular-nums',
                    item === page && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                  )}
                >
                  {item + 1}
                </Button>
              </li>
            ),
          )}
        </ul>
        <span className="text-muted-foreground px-2 text-sm tabular-nums sm:hidden">
          {t('common.pagination.compact', { page: page + 1, pages })}
        </span>

        <Button
          variant="ghost"
          size="icon"
          disabled={page >= pages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('common.pagination.next')}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </nav>
    </div>
  )
}

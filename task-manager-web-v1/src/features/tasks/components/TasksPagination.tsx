import { Button } from '@/shared/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type TasksPaginationProps = {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  onPageChange: (page: number) => void
}

/** Pagination (EX-11) : « x–y sur N » et boutons désactivés aux extrémités. */
export function TasksPagination({
  page,
  size,
  totalElements,
  totalPages,
  first,
  last,
  onPageChange,
}: TasksPaginationProps) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-muted-foreground text-sm">
        {t('tasks.pagination.range', { from, to, count: totalElements })}
      </p>

      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={first} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon className="size-4" />
          {t('tasks.pagination.previous')}
        </Button>
        <span className="text-muted-foreground px-1 text-sm">
          {t('tasks.pagination.page', { page: page + 1, pages: Math.max(totalPages, 1) })}
        </span>
        <Button variant="secondary" disabled={last} onClick={() => onPageChange(page + 1)}>
          {t('tasks.pagination.next')}
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

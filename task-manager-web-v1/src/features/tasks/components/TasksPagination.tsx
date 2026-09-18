import { Button } from '@/shared/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

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

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-muted-foreground text-sm">
        {from}–{to} sur {totalElements} tâche{totalElements > 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={first} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon className="size-4" />
          Précédent
        </Button>
        <span className="text-muted-foreground px-1 text-sm">
          Page {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button variant="secondary" disabled={last} onClick={() => onPageChange(page + 1)}>
          Suivant
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

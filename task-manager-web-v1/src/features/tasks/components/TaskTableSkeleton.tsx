import { Skeleton } from '@/shared/ui/skeleton'

/** État de chargement : squelette de lignes, sans décalage de mise en page. */
export function TaskTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
          <Skeleton className="hidden h-4 w-32 md:block" />
        </div>
      ))}
    </div>
  )
}

import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { useDueTasks } from '@/features/tasks/hooks/useTaskInsights'
import type { Task } from '@/features/tasks/types'
import { isOverdue } from '@/shared/lib/formatDate'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { BellIcon, CircleCheckBigIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const WINDOW_HOURS = 24

/**
 * Cloche de l'en-tête (capture) : tâches non terminées en retard ou à échéance sous 24 h.
 * Choisir une tâche ouvre la liste filtrée sur son titre.
 */
export function NotificationBell() {
  const { data, isError } = useDueTasks(WINDOW_HOURS)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const tasks = data ?? []
  const overdue = tasks.filter((task) => task.dueDate && isOverdue(task.dueDate))
  const upcoming = tasks.filter((task) => !overdue.includes(task))
  const count = tasks.length

  const openTask = (task: Task) => {
    setOpen(false)
    navigate(`/tasks?search=${encodeURIComponent(task.title)}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative"
          aria-label={count > 0 ? t('notifications.labelCount', { count }) : t('notifications.label')}
        >
          <BellIcon className="size-5" />
          {count > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">{t('notifications.title')}</p>
          <p className="text-muted-foreground text-xs">{t('notifications.subtitle')}</p>
        </div>

        <div className="max-h-96 overflow-y-auto py-1">
          {isError && <p className="text-destructive px-4 py-6 text-center text-sm">{t('notifications.unavailable')}</p>}

          {!isError && count === 0 && (
            <p className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
              <CircleCheckBigIcon className="text-success size-6" />
              {t('notifications.empty')}
            </p>
          )}

          <DueGroup title={t('notifications.overdue')} tasks={overdue} onSelect={openTask} />
          <DueGroup title={t('notifications.upcoming')} tasks={upcoming} onSelect={openTask} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DueGroup({ title, tasks, onSelect }: { title: string; tasks: Task[]; onSelect: (task: Task) => void }) {
  if (tasks.length === 0) {
    return null
  }
  return (
    <section aria-label={title}>
      <p className="text-muted-foreground px-4 pt-2 pb-1 text-xs font-medium tracking-wide uppercase">{title}</p>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onSelect(task)}
              className="hover:bg-accent focus-visible:bg-accent flex min-h-10 w-full flex-col items-start gap-0.5 px-4 py-2 text-left outline-none"
            >
              <span className="text-sm font-medium [overflow-wrap:anywhere]">{task.title}</span>
              <TaskDueDate task={task} compact />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

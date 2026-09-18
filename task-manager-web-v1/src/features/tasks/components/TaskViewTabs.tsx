import type { TaskView } from '@/features/tasks/types'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { KanbanSquareIcon, ListIcon, Table2Icon, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const VIEWS: { value: TaskView; icon: LucideIcon }[] = [
  { value: 'table', icon: Table2Icon },
  { value: 'list', icon: ListIcon },
  { value: 'kanban', icon: KanbanSquareIcon },
]

/** Onglets de vue de la capture (Table · List View · Kanban), en pilules avec icônes. */
export function TaskViewTabs({ view, onChange }: { view: TaskView; onChange: (view: TaskView) => void }) {
  const { t } = useTranslation()
  return (
    <Tabs value={view} onValueChange={(value) => onChange(value as TaskView)}>
      <TabsList aria-label={t('tasks.views.label')}>
        {VIEWS.map(({ value, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon />
            {t(`tasks.views.${value}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

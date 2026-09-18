import type { TaskView } from '@/features/tasks/types'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { KanbanSquareIcon, ListIcon, Table2Icon, type LucideIcon } from 'lucide-react'

const VIEWS: { value: TaskView; label: string; icon: LucideIcon }[] = [
  { value: 'table', label: 'Tableau', icon: Table2Icon },
  { value: 'list', label: 'Liste', icon: ListIcon },
  { value: 'kanban', label: 'Kanban', icon: KanbanSquareIcon },
]

/** Onglets de vue de la capture (Table · List View · Kanban), en pilules avec icônes. */
export function TaskViewTabs({ view, onChange }: { view: TaskView; onChange: (view: TaskView) => void }) {
  return (
    <Tabs value={view} onValueChange={(value) => onChange(value as TaskView)}>
      <TabsList aria-label="Vue des tâches">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

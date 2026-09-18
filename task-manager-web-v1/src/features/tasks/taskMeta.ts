import type { TaskPriority, TaskStatus } from '@/features/tasks/types'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/features/tasks/types'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CircleCheckBigIcon,
  CircleDashedIcon,
  EyeIcon,
  TimerIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * SOURCE UNIQUE des libellés, couleurs et icônes de statut et de priorité (INV-21).
 * Badges, filtres, tableau, cartes mobiles — et demain le Kanban (B-01) ou les
 * statistiques (B-03) — lisent tous ces deux tables. Aucun `switch (status)` ailleurs :
 * scripts/brain-check.sh échoue s'il en trouve un.
 *
 * Les couleurs sont des classes bâties sur les tokens du design system, jamais des
 * valeurs littérales. `satisfies Record<…>` fait échouer la compilation ici si un statut
 * est ajouté au type sans être décrit — au lieu d'un trou silencieux à l'exécution.
 */
export type TaskMeta = {
  label: string
  badgeClassName: string
  dotClassName: string
  /** Couleur du titre de colonne Kanban (statuts) — texte seul. */
  textClassName: string
  icon: LucideIcon
}

export const TASK_STATUS_META = {
  TODO: {
    label: 'À faire',
    badgeClassName: 'bg-status-todo/10 text-status-todo',
    dotClassName: 'bg-status-todo',
    textClassName: 'text-foreground',
    icon: CircleDashedIcon,
  },
  IN_PROGRESS: {
    label: 'En cours',
    badgeClassName: 'bg-status-progress/10 text-status-progress',
    dotClassName: 'bg-status-progress',
    textClassName: 'text-status-progress',
    icon: TimerIcon,
  },
  IN_REVIEW: {
    label: 'En revue',
    badgeClassName: 'bg-status-review/10 text-status-review',
    dotClassName: 'bg-status-review',
    textClassName: 'text-status-review',
    icon: EyeIcon,
  },
  DONE: {
    label: 'Terminé',
    badgeClassName: 'bg-status-done/10 text-status-done',
    dotClassName: 'bg-status-done',
    textClassName: 'text-status-done',
    icon: CircleCheckBigIcon,
  },
} as const satisfies Record<TaskStatus, TaskMeta>

export const TASK_PRIORITY_META = {
  LOW: {
    label: 'Basse',
    badgeClassName: 'bg-priority-low/10 text-priority-low',
    dotClassName: 'bg-priority-low',
    textClassName: 'text-priority-low',
    icon: ArrowDownIcon,
  },
  MEDIUM: {
    label: 'Moyenne',
    badgeClassName: 'bg-priority-medium/10 text-priority-medium',
    dotClassName: 'bg-priority-medium',
    textClassName: 'text-priority-medium',
    icon: ArrowRightIcon,
  },
  HIGH: {
    label: 'Haute',
    badgeClassName: 'bg-priority-high/10 text-priority-high',
    dotClassName: 'bg-priority-high',
    textClassName: 'text-priority-high',
    icon: ArrowUpIcon,
  },
} as const satisfies Record<TaskPriority, TaskMeta>

/** Options prêtes pour un `<Select>`, dérivées des tables ci-dessus. */
export const statusOptions = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_META[value].label }))
export const priorityOptions = TASK_PRIORITIES.map((value) => ({ value, label: TASK_PRIORITY_META[value].label }))

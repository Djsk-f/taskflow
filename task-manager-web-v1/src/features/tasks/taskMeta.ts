import type { TaskPriority, TaskStatus } from '@/features/tasks/types'
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
  /** Clé de traduction du libellé (fr/en) : `t(meta.labelKey)`. */
  labelKey: `status.${TaskStatus}` | `priority.${TaskPriority}`
  badgeClassName: string
  dotClassName: string
  /** Couleur du titre de colonne Kanban (statuts) — texte seul. */
  textClassName: string
  icon: LucideIcon
}

export const TASK_STATUS_META = {
  TODO: {
    labelKey: 'status.TODO',
    badgeClassName: 'bg-status-todo/10 text-status-todo-text',
    dotClassName: 'bg-status-todo',
    textClassName: 'text-foreground',
    icon: CircleDashedIcon,
  },
  IN_PROGRESS: {
    labelKey: 'status.IN_PROGRESS',
    badgeClassName: 'bg-status-progress/10 text-status-progress-text',
    dotClassName: 'bg-status-progress',
    textClassName: 'text-status-progress-text',
    icon: TimerIcon,
  },
  IN_REVIEW: {
    labelKey: 'status.IN_REVIEW',
    badgeClassName: 'bg-status-review/10 text-status-review-text',
    dotClassName: 'bg-status-review',
    textClassName: 'text-status-review-text',
    icon: EyeIcon,
  },
  DONE: {
    labelKey: 'status.DONE',
    badgeClassName: 'bg-status-done/10 text-status-done-text',
    dotClassName: 'bg-status-done',
    textClassName: 'text-status-done-text',
    icon: CircleCheckBigIcon,
  },
} as const satisfies Record<TaskStatus, TaskMeta>

export const TASK_PRIORITY_META = {
  LOW: {
    labelKey: 'priority.LOW',
    badgeClassName: 'bg-priority-low/10 text-priority-low-text',
    dotClassName: 'bg-priority-low',
    textClassName: 'text-priority-low-text',
    icon: ArrowDownIcon,
  },
  MEDIUM: {
    labelKey: 'priority.MEDIUM',
    badgeClassName: 'bg-priority-medium/10 text-priority-medium-text',
    dotClassName: 'bg-priority-medium',
    textClassName: 'text-priority-medium-text',
    icon: ArrowRightIcon,
  },
  HIGH: {
    labelKey: 'priority.HIGH',
    badgeClassName: 'bg-priority-high/10 text-priority-high-text',
    dotClassName: 'bg-priority-high',
    textClassName: 'text-priority-high-text',
    icon: ArrowUpIcon,
  },
} as const satisfies Record<TaskPriority, TaskMeta>

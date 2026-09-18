import { taskFormSchema, type TaskFormValues } from '@/features/tasks/schemas'

/**
 * Saisie d'une tâche interrompue par une session expirée : elle est rendue après la
 * reconnexion, dans le même onglet et pour le même compte uniquement. Sans cela, la
 * reconnexion ferait perdre un texte parfois long.
 */
export type TaskDraft = {
  userId: number
  /** Présent si la saisie modifiait une tâche existante. */
  taskId?: number
  values: TaskFormValues
}

const KEY = 'taskflow.taskDraft'

// sessionStorage peut être indisponible (navigation privée stricte, stockage bloqué) :
// on perd alors le brouillon, comme avant, sans casser le formulaire.
export const taskDraftStorage = {
  save(draft: TaskDraft): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft))
    } catch {
      // brouillon non conservé
    }
  },

  /** Brouillon de cet utilisateur, s'il existe et reste une saisie valide. */
  read(userId: number): TaskDraft | null {
    try {
      const draft = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<TaskDraft> | null
      const values = taskFormSchema.safeParse(draft?.values)
      if (!draft || draft.userId !== userId || !values.success) {
        return null
      }
      return { userId, taskId: typeof draft.taskId === 'number' ? draft.taskId : undefined, values: values.data }
    } catch {
      return null
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // rien à effacer
    }
  },
}

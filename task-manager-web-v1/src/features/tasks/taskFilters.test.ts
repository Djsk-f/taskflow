import { readTaskFilters, readTaskView, withTaskView, writeTaskFilters } from '@/features/tasks/taskFilters'
import { describe, expect, it } from 'vitest'

describe('filtres portés par l’URL', () => {
  it('ignorent les valeurs inconnues au lieu de les transmettre au serveur', () => {
    const filters = readTaskFilters(new URLSearchParams('status=FOO&priority=HIGH&page=-3&search=rapport'))
    expect(filters).toMatchObject({ status: null, priority: 'HIGH', page: 0, search: 'rapport' })
  })

  it('n’écrivent que les valeurs utiles (URL courte et partageable)', () => {
    const params = writeTaskFilters({ search: '', status: 'DONE', priority: null, page: 0, size: 10 })
    expect(params.toString()).toBe('status=DONE')
  })

  it('font du Kanban la vue par défaut, absente de l’URL', () => {
    expect(readTaskView(new URLSearchParams())).toBe('kanban')
    expect(readTaskView(new URLSearchParams('view=inconnue'))).toBe('kanban')
    expect(withTaskView(new URLSearchParams('status=DONE'), 'table').toString()).toBe('status=DONE&view=table')
    expect(withTaskView(new URLSearchParams('view=table'), 'kanban').toString()).toBe('')
  })
})

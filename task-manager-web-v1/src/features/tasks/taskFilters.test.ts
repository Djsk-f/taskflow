import {
  DEFAULT_SORT,
  readTaskFilters,
  readTaskView,
  toggleSort,
  withTaskView,
  writeTaskFilters,
} from '@/features/tasks/taskFilters'
import { describe, expect, it } from 'vitest'

describe('filtres portés par l’URL', () => {
  it('ignorent les valeurs inconnues au lieu de les transmettre au serveur', () => {
    const filters = readTaskFilters(new URLSearchParams('status=FOO&priority=HIGH&page=-3&search=rapport'))
    expect(filters).toMatchObject({ status: null, priority: 'HIGH', page: 0, search: 'rapport' })
  })

  it('n’écrivent que les valeurs utiles (URL courte et partageable)', () => {
    const params = writeTaskFilters({
      search: '',
      status: 'DONE',
      priority: null,
      due: null,
      sort: DEFAULT_SORT,
      page: 0,
      size: 10,
    })
    expect(params.toString()).toBe('status=DONE')
  })

  it('font du Kanban la vue par défaut, absente de l’URL', () => {
    expect(readTaskView(new URLSearchParams())).toBe('kanban')
    expect(readTaskView(new URLSearchParams('view=inconnue'))).toBe('kanban')
    expect(withTaskView(new URLSearchParams('status=DONE'), 'table').toString()).toBe('status=DONE&view=table')
    expect(withTaskView(new URLSearchParams('view=table'), 'kanban').toString()).toBe('')
  })

  it('lisent le filtre d’échéance et le tri, en ignorant les valeurs inconnues', () => {
    expect(readTaskFilters(new URLSearchParams('due=OVERDUE&sort=priority,desc'))).toMatchObject({
      due: 'OVERDUE',
      sort: { field: 'priority', direction: 'desc' },
    })
    expect(readTaskFilters(new URLSearchParams('due=BIENTOT&sort=password,asc'))).toMatchObject({
      due: null,
      sort: DEFAULT_SORT,
    })
  })

  it('n’écrivent le tri que s’il diffère du tri par défaut (échéance la plus proche)', () => {
    const base = { search: '', status: null, priority: null, due: null, page: 0, size: 10 }
    expect(writeTaskFilters({ ...base, sort: DEFAULT_SORT }).toString()).toBe('')
    expect(writeTaskFilters({ ...base, due: 'THIS_WEEK', sort: { field: 'title', direction: 'asc' } }).toString()).toBe(
      'due=THIS_WEEK&sort=title%2Casc',
    )
  })

  it('inversent le sens sur la même colonne et prennent le sens naturel d’une nouvelle', () => {
    expect(toggleSort(DEFAULT_SORT, 'dueDate')).toEqual({ field: 'dueDate', direction: 'desc' })
    expect(toggleSort(DEFAULT_SORT, 'priority')).toEqual({ field: 'priority', direction: 'desc' })
    expect(toggleSort({ field: 'priority', direction: 'desc' }, 'title')).toEqual({ field: 'title', direction: 'asc' })
  })
})

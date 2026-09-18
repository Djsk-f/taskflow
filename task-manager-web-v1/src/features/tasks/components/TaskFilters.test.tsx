import { TaskFiltersBar } from '@/features/tasks/components/TaskFilters'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

function renderBar(overrides: Partial<Parameters<typeof TaskFiltersBar>[0]> = {}) {
  const props = {
    searchDraft: '',
    onSearchDraftChange: vi.fn(),
    status: null,
    onStatusChange: vi.fn(),
    priority: null,
    onPriorityChange: vi.fn(),
    onClearFilters: vi.fn(),
    ...overrides,
  }
  render(<TaskFiltersBar {...props} />)
  return props
}

describe('TaskFiltersBar', () => {
  it('sélectionne une priorité depuis le panneau « Filtres »', async () => {
    const user = userEvent.setup()
    const props = renderBar()

    await user.click(screen.getByRole('button', { name: 'Filtres' }))
    await user.click(screen.getByRole('button', { name: /Haute/ }))

    expect(props.onPriorityChange).toHaveBeenCalledWith('HIGH')
  })

  it('affiche les filtres actifs en étiquettes supprimables, et « Tout effacer »', async () => {
    const user = userEvent.setup()
    const props = renderBar({ priority: 'HIGH', status: 'DONE' })

    expect(screen.getByText('Priorité : Haute')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filtres \(2 actifs\)/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retirer le filtre « Priorité : Haute »' }))
    expect(props.onPriorityChange).toHaveBeenCalledWith(null)

    await user.click(screen.getByRole('button', { name: 'Tout effacer' }))
    expect(props.onClearFilters).toHaveBeenCalledTimes(1)
  })

  it('masque le statut en vue Kanban (les colonnes sont les statuts)', async () => {
    const user = userEvent.setup()
    renderBar({ showStatus: false, status: 'DONE' })

    expect(screen.queryByText(/Statut :/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filtres' }))
    expect(screen.queryByText('Statut')).not.toBeInTheDocument()
    expect(screen.getByText('Priorité')).toBeInTheDocument()
  })
})

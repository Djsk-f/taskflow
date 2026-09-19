import { TaskCompleteButton } from '@/features/tasks/components/TaskCompleteButton'
import { TaskRowActions } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const task = (status: Task['status']): Task => ({
  id: 1,
  title: 'Envoyer le devis',
  status,
  priority: 'MEDIUM',
  createdAt: '2026-09-19T08:00:00Z',
  updatedAt: '2026-09-19T08:00:00Z',
  timeSpentMinutes: 0,
})
const handlers = () => ({ onEdit: vi.fn(), onDelete: vi.fn(), onMove: vi.fn(), onLogTime: vi.fn() })

describe('tâche terminée', () => {
  it('n’offre plus de changement de statut dans le menu', async () => {
    const user = userEvent.setup()
    render(<TaskRowActions task={task('DONE')} {...handlers()} />)
    await user.click(screen.getByRole('button', { name: 'Actions sur « Envoyer le devis »' }))
    expect(screen.queryByRole('menuitem', { name: 'En cours' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('affiche une coche, sans bouton pour la rouvrir', () => {
    render(<TaskCompleteButton task={task('DONE')} onMove={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Terminée')).toBeInTheDocument()
  })

  it('une tâche en cours se marque terminée en un clic', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<TaskCompleteButton task={task('IN_PROGRESS')} onMove={onMove} />)
    await user.click(screen.getByRole('button', { name: 'Marquer « Envoyer le devis » comme terminée' }))
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'DONE')
  })
})

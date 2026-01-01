import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipeActionsMenu } from '@/components/recipe-actions-menu'
import { toast } from 'sonner'
import { mockRouterPush, mockRouterRefresh } from '../setup'

const mockToast = vi.mocked(toast)

const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('RecipeActionsMenu', () => {
  const defaultProps = {
    recipeId: 'test-recipe-id',
    recipeTitle: 'Pasta Carbonara',
    workspaceId: 'test-workspace-id',
    isOwner: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockFrom.mockReturnValue({
      update: mockUpdate,
      delete: mockDelete,
    })
  })

  it('renders menu trigger button', () => {
    render(<RecipeActionsMenu {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('shows rename option in dropdown menu', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument()
  })

  it('does not show delete option for non-owners', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={false} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows delete option for owners', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('opens rename dialog and allows renaming', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /rename/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Rename recipe')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Recipe title')
    expect(input).toHaveValue('Pasta Carbonara')

    await user.clear(input)
    await user.type(input, 'Spaghetti Bolognese')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('recipes')
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Spaghetti Bolognese' })
      expect(mockToast.success).toHaveBeenCalledWith('Recipe renamed')
      expect(mockRouterRefresh).toHaveBeenCalled()
    })
  })

  it('shows error when renaming with empty title', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /rename/i }))

    const input = screen.getByPlaceholderText('Recipe title')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter a title')
    })
  })

  it('opens delete confirmation dialog for owners', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete recipe')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
  })

  it('deletes recipe when confirmed', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('recipes')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('Recipe deleted')
      expect(mockRouterPush).toHaveBeenCalledWith('/w/test-workspace-id/recipes')
    })
  })

  it('calls onDeleted callback instead of navigating when provided', async () => {
    const onDeleted = vi.fn()
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={true} onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalled()
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  })

  it('can cancel rename dialog', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /rename/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('can cancel delete dialog', async () => {
    const user = userEvent.setup()
    render(<RecipeActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })
})

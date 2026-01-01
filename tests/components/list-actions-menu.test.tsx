import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListActionsMenu } from '@/components/list-actions-menu'
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

describe('ListActionsMenu', () => {
  const defaultProps = {
    listId: 'test-list-id',
    listName: 'My Shopping List',
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
    render(<ListActionsMenu {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('shows rename option in dropdown menu', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument()
  })

  it('does not show delete option for non-owners', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} isOwner={false} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows delete option for owners', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('opens rename dialog and allows renaming', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /rename/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Rename list')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('List name')
    expect(input).toHaveValue('My Shopping List')

    await user.clear(input)
    await user.type(input, 'New List Name')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_lists')
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'New List Name' })
      expect(mockToast.success).toHaveBeenCalledWith('List renamed')
      expect(mockRouterRefresh).toHaveBeenCalled()
    })
  })

  it('shows error when renaming with empty name', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /rename/i }))

    const input = screen.getByPlaceholderText('List name')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter a name')
    })
  })

  it('opens delete confirmation dialog for owners', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete list')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
  })

  it('deletes list when confirmed', async () => {
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_lists')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('List deleted')
      expect(mockRouterPush).toHaveBeenCalledWith('/w/test-workspace-id/lists')
    })
  })

  it('calls onDeleted callback instead of navigating when provided', async () => {
    const onDeleted = vi.fn()
    const user = userEvent.setup()
    render(<ListActionsMenu {...defaultProps} isOwner={true} onDeleted={onDeleted} />)

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
    render(<ListActionsMenu {...defaultProps} />)

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
    render(<ListActionsMenu {...defaultProps} isOwner={true} />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })
})

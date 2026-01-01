import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateListForm } from '@/components/create-list-form'
import { toast } from 'sonner'
import { mockRouterPush } from '../setup'

const mockToast = vi.mocked(toast)

// Mock Supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}))

describe('CreateListForm', () => {
  const workspaceId = 'test-workspace-id'

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
    })
    
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'new-list-id', name: 'Test List' }, 
          error: null 
        }),
      }),
    })
    
    mockFrom.mockReturnValue({
      insert: mockInsert,
    })
  })

  it('renders form elements', () => {
    render(<CreateListForm workspaceId={workspaceId} />)
    
    expect(screen.getByText('Create New List')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Weekly Groceries/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create List' })).toBeInTheDocument()
  })

  it('allows list name input', async () => {
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    expect(nameInput).toHaveValue('My Shopping List')
  })

  it('shows error when submitting empty name', async () => {
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter a list name')
    })
  })

  it('creates list and redirects on success', async () => {
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_lists')
      expect(mockInsert).toHaveBeenCalledWith({
        workspace_id: workspaceId,
        name: 'My Shopping List',
        created_by: 'test-user-id',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Shopping list created!')
      expect(mockRouterPush).toHaveBeenCalledWith(`/w/${workspaceId}/lists/new-list-id`)
    })
  })

  it('shows error when user is not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in')
    })
  })

  it('shows error when database insert fails', async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    })
    
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create shopping list')
    })
  })

  it('clears input after successful creation', async () => {
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(nameInput).toHaveValue('')
    })
  })

  it('shows loading state during submission', async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockImplementation(() => new Promise(() => {})),
      }),
    })
    
    const user = userEvent.setup()
    render(<CreateListForm workspaceId={workspaceId} />)
    
    const nameInput = screen.getByPlaceholderText(/Weekly Groceries/)
    await user.type(nameInput, 'My Shopping List')
    
    const submitButton = screen.getByRole('button', { name: 'Create List' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument()
      expect(nameInput).toBeDisabled()
    })
  })
})

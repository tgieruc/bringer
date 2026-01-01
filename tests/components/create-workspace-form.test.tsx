import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateWorkspaceForm } from '@/components/create-workspace-form'
import { toast } from 'sonner'
import { mockRouterPush, mockRouterRefresh } from '../setup'

const mockToast = vi.mocked(toast)

// Mock Supabase client
const mockGetUser = vi.fn()
const mockRpc = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  }),
}))

describe('CreateWorkspaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
    })
    mockRpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'new-workspace-id', name: 'Test Workspace' }, 
        error: null 
      }),
    })
  })

  it('renders form elements', () => {
    render(<CreateWorkspaceForm />)
    
    expect(screen.getByText('Create Your First Workspace')).toBeInTheDocument()
    expect(screen.getByLabelText('Workspace Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeInTheDocument()
  })

  it('allows workspace name input', async () => {
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, 'My Workspace')
    
    expect(nameInput).toHaveValue('My Workspace')
  })

  it('shows error when submitting empty name', async () => {
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter a workspace name')
    })
  })

  it('creates workspace and redirects on success', async () => {
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, 'My Workspace')
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('create_workspace_with_member', {
        p_name: 'My Workspace',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Workspace created!')
      expect(mockRouterPush).toHaveBeenCalledWith('/w/new-workspace-id/lists')
      expect(mockRouterRefresh).toHaveBeenCalled()
    })
  })

  it('shows error when user is not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, 'My Workspace')
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in')
    })
  })

  it('shows error when RPC fails', async () => {
    mockRpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      }),
    })
    
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, 'My Workspace')
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create workspace')
    })
  })

  it('shows loading state during submission', async () => {
    mockRpc.mockReturnValue({
      single: vi.fn().mockImplementation(() => new Promise(() => {})),
    })
    
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, 'My Workspace')
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument()
      expect(nameInput).toBeDisabled()
    })
  })

  it('trims whitespace from workspace name', async () => {
    const user = userEvent.setup()
    render(<CreateWorkspaceForm />)
    
    const nameInput = screen.getByLabelText('Workspace Name')
    await user.type(nameInput, '  My Workspace  ')
    
    const submitButton = screen.getByRole('button', { name: 'Create Workspace' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('create_workspace_with_member', {
        p_name: 'My Workspace',
      })
    })
  })
})

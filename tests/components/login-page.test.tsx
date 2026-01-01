import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import { toast } from 'sonner'

// Mock Supabase client
const mockSignInWithOtp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}))

const mockToast = vi.mocked(toast)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null })
  })

  it('renders login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Bringer')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()
  })

  it('allows email input', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'test@example.com')
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('submits form and calls signInWithOtp', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'test@example.com')
    
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })
  })

  it('shows success toast on successful submission', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'test@example.com')
    
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Check your email for the magic link!')
    })
  })

  it('shows error toast on failed submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ 
      data: null, 
      error: { message: 'Invalid email' } 
    })
    
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'test@example.com')
    
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Invalid email')
    })
  })

  it('shows loading state during submission', async () => {
    // Make the mock hang to observe loading state
    mockSignInWithOtp.mockImplementation(() => new Promise(() => {}))
    
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'test@example.com')
    
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument()
      expect(emailInput).toBeDisabled()
    })
  })
})
